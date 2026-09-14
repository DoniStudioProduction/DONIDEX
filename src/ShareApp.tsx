import { useEffect, useState } from 'react';
import { Download, ExternalLink, Link2, Share2, Smartphone, X } from 'lucide-react';

const APP_URL = window.location.origin + '/';
const PLAY_STORE_URL = (import.meta.env.VITE_PLAY_STORE_URL || '').trim();

type ShareAppProps = { compact?: boolean };

export default function ShareApp({ compact = false }: ShareAppProps) {
  const [open, setOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setNotice('DONIDEX installed successfully.');
    };
    setInstalled(window.matchMedia?.('(display-mode: standalone)').matches || Boolean((navigator as any).standalone));
    window.addEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) {
      setNotice('Use your browser menu and choose “Add to Home screen” or “Install app”.');
      return;
    }
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const share = async () => {
    const data = { title: 'DONIDEX', text: 'Install DONIDEX — Create. Grow. Dominate.', url: APP_URL };
    if (navigator.share) {
      try { await navigator.share(data); return; } catch { /* user cancelled */ }
    }
    await navigator.clipboard?.writeText(APP_URL);
    setNotice('DONIDEX link copied.');
  };

  const copy = async () => {
    await navigator.clipboard?.writeText(APP_URL);
    setNotice('DONIDEX link copied.');
  };

  return <>
    <button className={compact ? 'share-app-trigger compact' : 'share-app-trigger'} onClick={() => setOpen(true)} aria-label="Install or share DONIDEX">
      <Share2 size={15} /> <span>{compact ? 'Share' : 'Install / Share DONIDEX'}</span>
    </button>
    {open && <div className="share-app-backdrop" role="presentation" onClick={() => setOpen(false)}>
      <section className="share-app-modal" role="dialog" aria-modal="true" aria-labelledby="share-app-title" onClick={e => e.stopPropagation()}>
        <div className="share-app-head"><div><p className="eyebrow">DONIDEX DISTRIBUTION</p><h2 id="share-app-title">Get DONIDEX</h2></div><button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close"><X size={17}/></button></div>
        <p className="share-app-copy">Install DONIDEX directly on your device, get it from Google Play when the listing is live, or share the app with someone else.</p>
        <div className="share-app-actions">
          {!installed && <button className="primary share-app-option" onClick={install}><Download size={18}/><span><b>Install directly</b><small>No Play Store required</small></span></button>}
          {PLAY_STORE_URL && <a className="secondary share-app-option" href={PLAY_STORE_URL} target="_blank" rel="noreferrer"><Smartphone size={18}/><span><b>Google Play</b><small>Official Android listing</small></span><ExternalLink size={14}/></a>}
          <button className="secondary share-app-option" onClick={share}><Share2 size={18}/><span><b>Share DONIDEX</b><small>Use your phone's sharing menu</small></span></button>
          <button className="ghost share-app-option" onClick={copy}><Link2 size={18}/><span><b>Copy app link</b><small>{APP_URL}</small></span></button>
        </div>
        {notice && <p className="share-app-notice" role="status">{notice}</p>}
        {!PLAY_STORE_URL && <p className="share-app-note">Google Play integration is ready for the official listing URL. It will appear here once the Play Store listing is published.</p>}
      </section>
    </div>}
  </>;
}
