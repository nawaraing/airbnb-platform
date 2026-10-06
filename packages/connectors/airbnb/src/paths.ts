import { fileURLToPath } from "node:url";
import path from "node:path";

const REPO_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));

/**
 * 로그인 세션이 담긴 로컬 폴더 (git 제외). 쿠키가 들어 있으므로 비밀번호처럼 다룬다.
 * AIRBNB_SESSION_DIR로 위치를 바꿀 수 있다.
 */
export const SESSION_DIR = process.env.AIRBNB_SESSION_DIR ?? path.join(REPO_ROOT, ".airbnb-session");
export const CHROME_PROFILE_DIR = path.join(SESSION_DIR, "chrome-profile");
export const STORAGE_STATE_PATH = path.join(SESSION_DIR, "storage-state.json");
export const CAPTURES_DIR = path.join(SESSION_DIR, "captures");

/** 이 프로젝트 전용 Chrome의 원격 디버깅 포트 (127.0.0.1에만 열린다) */
export const DEBUG_PORT = Number(process.env.AIRBNB_CHROME_PORT ?? 9333);

export const AIRBNB_ORIGIN = "https://www.airbnb.co.kr";
