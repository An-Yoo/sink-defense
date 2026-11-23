// 싱크대 수비대 원스토어(ONEplay 웹게임) 연동
// - 원스토어 H5 Game SDK 수명주기: initializeAsync → setLoadingProgress → startGameAsync
// - exit/pause 이벤트에서 바로 저장, 뒤로가기: 열린 창 닫기 → 영업 중이면 일시정지 → 다른 탭이면 영업 탭 → 원스토어 기본 종료 확인
// 일반 브라우저에서는 SDK가 { err }를 돌려주므로 아무것도 하지 않고 게임만 실행된다.
import { createSDK } from 'https://h5sdk.onestore.net/lib/v1.1.0/onestore-h5-sdk.min.js';

const sdk = createSDK();
window.__onestore = sdk;

function saveNow() { try { window.SD && SD.meta && SD.meta.save(); } catch (e) { } }

sdk.on('exit', () => saveNow());
sdk.on('pause', () => { saveNow(); try { const G = SD.ui.G; if (G && G.phase === 'wave' && !document.querySelector('#modal.show')) document.querySelector('#pause').click(); } catch (e) { } });

sdk.onBackPressed(() => {
  const m = document.querySelector('#modal.show');
  if (m) {
    const c = m.querySelector('[data-close], #pGo, #mOk');
    if (c) { c.click(); return true; }
    return true;   // 꼭 골라야 하는 창(규칙 선택 등)은 닫지 않음
  }
  const lobby = document.querySelector('#lobby');
  if (lobby && lobby.style.display === 'none') { const p = document.querySelector('#pause'); if (p) { p.click(); return true; } }
  const play = document.querySelector('.ltab[data-t="play"]');
  if (play && lobby && lobby.dataset.tab !== 'play') { play.click(); return true; }
  saveNow();
  return false;   // 원스토어 앱의 기본 종료 확인으로 넘김
});

function applySafeArea(sa) {
  if (!sa) return;
  document.documentElement.style.setProperty('--sa-top', (sa.top || 0) + 'px');
  document.documentElement.style.setProperty('--sa-bottom', (sa.bottom || 0) + 'px');
  window.dispatchEvent(new Event('resize'));
}

const waitReady = () => new Promise((res) => {
  const t0 = Date.now();
  const tick = () => {
    const ready = !!window.__sdReady;
    sdk.setLoadingProgress(ready ? 100 : Math.min(95, 20 + Math.floor((Date.now() - t0) / 60)));
    if (ready || Date.now() - t0 > 15000) return res(ready);
    setTimeout(tick, 100);
  };
  tick();
});

sdk.initializeAsync()
  .then(async (info) => {
    if (info && info.err) return;
    applySafeArea(info.safeArea);
    sdk.setLoadingProgress(10);
    await waitReady();
    await sdk.startGameAsync();
  })
  .catch(() => { });
