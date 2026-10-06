// M0 로컬 드라이버: 일반 Chrome을 전용 프로필로 띄우고 원격 디버깅(CDP)으로 연결한다.
// 자동화 도구가 직접 띄운 브라우저는 Google 로그인이 막히는 경우가 많아서,
// 사람이 직접 로그인할 수 있는 평범한 Chrome 창을 쓰고 프로그램은 나중에 붙는다.
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { chromium, type Browser, type BrowserContext } from "playwright-core";
import { CHROME_PROFILE_DIR, DEBUG_PORT, SESSION_DIR } from "./paths";

const CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function debuggerUp(): Promise<boolean> {
  try {
    const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Apple Silicon에서 Node가 인텔용(x64, Rosetta)이면 자식 프로세스도 인텔 모드로 뜬다.
 * 이때 Chrome이 에뮬레이션으로 돌아 매우 느려지므로 arch -arm64로 네이티브 실행을 강제한다.
 */
function needsArm64Launch(): boolean {
  if (process.platform !== "darwin" || process.arch === "arm64") return false;
  try {
    return execFileSync("/usr/sbin/sysctl", ["-n", "hw.optional.arm64"], { encoding: "utf8" }).trim() === "1";
  } catch {
    return false;
  }
}

/** 전용 Chrome이 떠 있지 않으면 띄운다. 이미 떠 있으면 그대로 둔다. */
export async function ensureChrome(startUrl: string): Promise<{ launched: boolean }> {
  if (await debuggerUp()) return { launched: false };

  const executable = process.env.CHROME_PATH ?? CHROME_PATHS.find((p) => existsSync(p));
  if (!executable) throw new Error("Google Chrome을 찾지 못했습니다. CHROME_PATH 환경 변수로 경로를 지정하세요.");

  mkdirSync(SESSION_DIR, { recursive: true, mode: 0o700 });
  mkdirSync(CHROME_PROFILE_DIR, { recursive: true, mode: 0o700 });

  const chromeArgs = [
    `--user-data-dir=${CHROME_PROFILE_DIR}`,
    `--remote-debugging-port=${DEBUG_PORT}`,
    "--remote-debugging-address=127.0.0.1",
    "--no-first-run",
    "--no-default-browser-check",
    "--lang=ko-KR",
    startUrl,
  ];
  const [command, args] = needsArm64Launch()
    ? ["/usr/bin/arch", ["-arm64", executable, ...chromeArgs]]
    : [executable, chromeArgs];
  const child = spawn(command, args, { detached: true, stdio: "ignore" });
  child.unref();

  for (let i = 0; i < 75; i++) {
    if (await debuggerUp()) return { launched: true };
    await sleep(200);
  }
  throw new Error(`Chrome 디버깅 포트(${DEBUG_PORT})에 연결하지 못했습니다.`);
}

export async function connect(): Promise<{ browser: Browser; context: BrowserContext }> {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${DEBUG_PORT}`);
  const context = browser.contexts()[0];
  if (!context) throw new Error("Chrome 기본 컨텍스트를 찾지 못했습니다.");
  return { browser, context };
}
