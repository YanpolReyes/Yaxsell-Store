'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, AlertCircle, Loader2, ArrowLeft, Mail, Lock, User, Phone, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const LOGO_URL = 'https://firebasestorage.googleapis.com/v0/b/geminai-449212.firebasestorage.app/o/KEVINCOCO%2FGemini_Generated_Image_v5vfu6v5vfu6v5vf.png?alt=media&token=a049b070-6653-435b-a978-9cb06a92f865';

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, register, isLoggedIn, isLoading } = useAuth();

  const [tab, setTab] = useState<'login' | 'register'>(
    params.get('tab') === 'register' ? 'register' : 'login'
  );
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const emailParam = params.get('email') || '';
  const [loginForm, setLoginForm] = useState({ email: emailParam, password: '' });
  const [regForm, setRegForm] = useState({ firstName: '', lastName: '', email: '', phone: '', rut: '', password: '', confirm: '' });

  useEffect(() => {
    if (!isLoading && isLoggedIn) router.replace('/cuenta');
  }, [isLoggedIn, isLoading, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) { setError('Completá todos los campos'); return; }
    setSubmitting(true); setError('');
    const res = await login(loginForm.email, loginForm.password);
    setSubmitting(false);
    if (res.success) router.replace('/cuenta');
    else setError(res.error || 'Error al iniciar sesión');
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regForm.firstName || !regForm.lastName || !regForm.email || !regForm.password) { setError('Completá todos los campos obligatorios'); return; }
    if (regForm.password !== regForm.confirm) { setError('Las contraseñas no coinciden'); return; }
    if (regForm.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setSubmitting(true); setError('');
    const fullName = `${regForm.firstName.trim()} ${regForm.lastName.trim()}`;
    const res = await register(regForm.email, regForm.password, fullName, regForm.phone || undefined, regForm.rut || undefined);
    setSubmitting(false);
    if (res.success) router.replace('/cuenta');
    else setError(res.error || 'Error al registrarse');
  }

  const inputWrap: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 0,
    border: '2px solid #f3f4f6', borderRadius: 14, overflow: 'hidden',
    background: '#fafafa', transition: 'all 0.25s',
  };
  const inputIcon: React.CSSProperties = {
    padding: '0 0 0 14px', display: 'flex', alignItems: 'center', color: '#9ca3af', flexShrink: 0,
  };
  const inp: React.CSSProperties = {
    flex: 1, border: 'none', outline: 'none', padding: '13px 14px', fontSize: 14,
    color: '#333', background: 'transparent', fontFamily: '"DM Sans",system-ui,sans-serif',
  };
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 8,
    fontFamily: '"DM Sans",system-ui,sans-serif',
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: '"DM Sans",system-ui,sans-serif', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'url(https://png.pngtree.com/background/20250214/original/pngtree-pastel-pink-decorative-pattern-picture-image_15969494.jpg) center/cover no-repeat', filter: 'blur(8px)', zIndex: -1, animation: 'bgMove 20s ease-in-out infinite alternate', backgroundSize: '120% 120%' }} />
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.3)', zIndex: -1 }} />
      {/* Top bar */}
      <div style={{ padding: '0 5%', height: 64, display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(236,72,153,0.1)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src={LOGO_URL} alt="Logo" style={{ height: 36, width: 'auto' }} />
        </Link>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#ec4899', textDecoration: 'none', fontSize: 14, marginBottom: 20, fontWeight: 600 }}>
            <ArrowLeft size={15} /> Volver al inicio
          </Link>

          <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 24px 80px rgba(236,72,153,0.12),0 8px 32px rgba(0,0,0,0.06)', border: '1px solid rgba(236,72,153,0.1)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#fce7f3,#fbcfe8)', padding: '28px 28px 20px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 12px', border: '2px solid rgba(236,72,153,0.2)' }}>
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNrs0xQ1se5Q01MgfbyE15y_X9uExL5V9xAA&s" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#ec4899', margin: 0, letterSpacing: '-0.01em' }}>
                {tab === 'login' ? 'Inicia sesión' : 'Creá tu cuenta'}
              </h1>
              <p style={{ fontSize: 13, color: '#ec4899', margin: '4px 0 0', opacity: 0.8 }}>
                {tab === 'login' ? 'Accede a ofertas exclusivas' : 'Registrate para disfrutar beneficios'}
              </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6' }}>
              {(['login', 'register'] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setError(''); }}
                  style={{ flex: 1, padding: '14px 0', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: tab === t ? 700 : 500, color: tab === t ? '#ec4899' : '#9ca3af', borderBottom: tab === t ? '3px solid #ec4899' : '3px solid transparent', transition: 'all .2s', fontFamily: 'inherit' }}>
                  {t === 'login' ? 'Iniciar sesión' : 'Registrate'}
                </button>
              ))}
            </div>

            <div style={{ padding: '24px 28px 28px' }}>
              {/* Error */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 14px', background: '#fef2f8', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 14, marginBottom: 20 }}>
                  <AlertCircle size={16} color="#ec4899" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: '#ec4899' }}>{error}</span>
                </div>
              )}

              {/* ── LOGIN FORM ── */}
              {tab === 'login' && (
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <label style={lbl}>Correo electrónico</label>
                    <div style={inputWrap}>
                      <div style={inputIcon}><Mail size={16} /></div>
                      <input type="email" value={loginForm.email}
                        onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                        style={inp} placeholder="tu@correo.com" autoComplete="email" autoFocus
                        onFocus={e => { (e.target.closest('div') as HTMLElement).style.borderColor = '#ec4899'; (e.target.closest('div') as HTMLElement).style.background = '#fff'; (e.target.closest('div') as HTMLElement).style.boxShadow = '0 0 0 4px rgba(236,72,153,0.1)'; }}
                        onBlur={e => { (e.target.closest('div') as HTMLElement).style.borderColor = '#f3f4f6'; (e.target.closest('div') as HTMLElement).style.background = '#fafafa'; (e.target.closest('div') as HTMLElement).style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <label style={{ ...lbl, marginBottom: 0 }}>Contraseña</label>
                      <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#ec4899', padding: 0, fontWeight: 600 }}>
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div style={inputWrap}>
                      <div style={inputIcon}><Lock size={16} /></div>
                      <input type={showPass ? 'text' : 'password'} value={loginForm.password}
                        onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                        style={{ ...inp, paddingRight: 42 }} placeholder="Contraseña" autoComplete="current-password"
                        onFocus={e => { (e.target.closest('div') as HTMLElement).style.borderColor = '#ec4899'; (e.target.closest('div') as HTMLElement).style.background = '#fff'; (e.target.closest('div') as HTMLElement).style.boxShadow = '0 0 0 4px rgba(236,72,153,0.1)'; }}
                        onBlur={e => { (e.target.closest('div') as HTMLElement).style.borderColor = '#f3f4f6'; (e.target.closest('div') as HTMLElement).style.background = '#fafafa'; (e.target.closest('div') as HTMLElement).style.boxShadow = 'none'; }}
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#9ca3af' }}>
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={submitting}
                    style={{ width: '100%', padding: '14px 0', background: submitting ? '#fbcfe8' : 'linear-gradient(135deg,#fce7f3,#fbcfe8)', color: '#ec4899', border: '1.5px solid rgba(236,72,153,0.2)', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, boxShadow: '0 6px 24px rgba(236,72,153,0.15)', transition: 'all 0.25s', fontFamily: 'inherit' }}>
                    {submitting ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />Ingresando...</> : 'Ingresar'}
                  </button>
                  <p style={{ textAlign: 'center', margin: 0, fontSize: 13, color: '#6b7280' }}>
                    ¿No tenés cuenta?{' '}
                    <button type="button" onClick={() => { setTab('register'); setError(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ec4899', fontWeight: 700, fontSize: 13, padding: 0 }}>
                      Registrate gratis
                    </button>
                  </p>
                </form>
              )}

              {/* ── REGISTER FORM ── */}
              {tab === 'register' && (
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={lbl}>Nombres *</label>
                      <div style={inputWrap}>
                        <div style={inputIcon}><User size={16} /></div>
                        <input value={regForm.firstName}
                          onChange={e => setRegForm(f => ({ ...f, firstName: e.target.value }))}
                          style={inp} placeholder="Juan Carlos" autoFocus
                          onFocus={e => { (e.target.closest('div') as HTMLElement).style.borderColor = '#ec4899'; (e.target.closest('div') as HTMLElement).style.background = '#fff'; }}
                          onBlur={e => { (e.target.closest('div') as HTMLElement).style.borderColor = '#f3f4f6'; (e.target.closest('div') as HTMLElement).style.background = '#fafafa'; }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={lbl}>Apellidos *</label>
                      <div style={inputWrap}>
                        <div style={inputIcon}><User size={16} /></div>
                        <input value={regForm.lastName}
                          onChange={e => setRegForm(f => ({ ...f, lastName: e.target.value }))}
                          style={inp} placeholder="Pérez González"
                          onFocus={e => { (e.target.closest('div') as HTMLElement).style.borderColor = '#ec4899'; (e.target.closest('div') as HTMLElement).style.background = '#fff'; }}
                          onBlur={e => { (e.target.closest('div') as HTMLElement).style.borderColor = '#f3f4f6'; (e.target.closest('div') as HTMLElement).style.background = '#fafafa'; }}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Correo electrónico *</label>
                    <div style={inputWrap}>
                      <div style={inputIcon}><Mail size={16} /></div>
                      <input type="email" value={regForm.email}
                        onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                        style={inp} placeholder="tu@correo.com"
                        onFocus={e => { (e.target.closest('div') as HTMLElement).style.borderColor = '#ec4899'; (e.target.closest('div') as HTMLElement).style.background = '#fff'; }}
                        onBlur={e => { (e.target.closest('div') as HTMLElement).style.borderColor = '#f3f4f6'; (e.target.closest('div') as HTMLElement).style.background = '#fafafa'; }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Teléfono <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span></label>
                    <div style={inputWrap}>
                      <div style={inputIcon}><Phone size={16} /></div>
                      <input type="tel" value={regForm.phone}
                        onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))}
                        style={inp} placeholder="+56 9 1234 5678"
                        onFocus={e => { (e.target.closest('div') as HTMLElement).style.borderColor = '#ec4899'; (e.target.closest('div') as HTMLElement).style.background = '#fff'; }}
                        onBlur={e => { (e.target.closest('div') as HTMLElement).style.borderColor = '#f3f4f6'; (e.target.closest('div') as HTMLElement).style.background = '#fafafa'; }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>RUT <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span></label>
                    <div style={inputWrap}>
                      <div style={inputIcon}><CreditCard size={16} /></div>
                      <input value={regForm.rut}
                        onChange={e => {
                          const clean = e.target.value.replace(/[^0-9kK]/g, '').toUpperCase();
                          if (clean.length <= 1) { setRegForm(f => ({ ...f, rut: clean })); return; }
                          const body = clean.slice(0, -1);
                          const dv = clean.slice(-1);
                          const formatted = `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
                          setRegForm(f => ({ ...f, rut: formatted }));
                        }}
                        style={inp} placeholder="12.345.678-9" maxLength={12}
                        onFocus={e => { (e.target.closest('div') as HTMLElement).style.borderColor = '#ec4899'; (e.target.closest('div') as HTMLElement).style.background = '#fff'; }}
                        onBlur={e => { (e.target.closest('div') as HTMLElement).style.borderColor = '#f3f4f6'; (e.target.closest('div') as HTMLElement).style.background = '#fafafa'; }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Contraseña *</label>
                    <div style={{ ...inputWrap, position: 'relative' }}>
                      <div style={inputIcon}><Lock size={16} /></div>
                      <input type={showPass ? 'text' : 'password'} value={regForm.password}
                        onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                        style={{ ...inp, paddingRight: 42 }} placeholder="Mínimo 8 caracteres"
                        onFocus={e => { (e.target.closest('div') as HTMLElement).style.borderColor = '#ec4899'; (e.target.closest('div') as HTMLElement).style.background = '#fff'; }}
                        onBlur={e => { (e.target.closest('div') as HTMLElement).style.borderColor = '#f3f4f6'; (e.target.closest('div') as HTMLElement).style.background = '#fafafa'; }}
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#9ca3af' }}>
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Confirmar contraseña *</label>
                    <div style={{ ...inputWrap, borderColor: regForm.confirm && regForm.confirm !== regForm.password ? '#f87171' : '#f3f4f6' }}>
                      <div style={inputIcon}><Lock size={16} /></div>
                      <input type="password" value={regForm.confirm}
                        onChange={e => setRegForm(f => ({ ...f, confirm: e.target.value }))}
                        style={inp} placeholder="Repetí tu contraseña"
                        onFocus={e => { if (!regForm.confirm || regForm.confirm === regForm.password) { (e.target.closest('div') as HTMLElement).style.borderColor = '#ec4899'; (e.target.closest('div') as HTMLElement).style.background = '#fff'; } }}
                        onBlur={e => { if (!regForm.confirm || regForm.confirm === regForm.password) { (e.target.closest('div') as HTMLElement).style.borderColor = '#f3f4f6'; (e.target.closest('div') as HTMLElement).style.background = '#fafafa'; } }}
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={submitting}
                    style={{ width: '100%', padding: '14px 0', background: submitting ? '#fbcfe8' : 'linear-gradient(135deg,#fce7f3,#fbcfe8)', color: '#ec4899', border: '1.5px solid rgba(236,72,153,0.2)', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, boxShadow: '0 6px 24px rgba(236,72,153,0.15)', transition: 'all 0.25s', fontFamily: 'inherit' }}>
                    {submitting ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />Creando cuenta...</> : 'Crear cuenta'}
                  </button>
                  <p style={{ textAlign: 'center', margin: 0, fontSize: 13, color: '#6b7280' }}>
                    ¿Ya tenés cuenta?{' '}
                    <button type="button" onClick={() => { setTab('login'); setError(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ec4899', fontWeight: 700, fontSize: 13, padding: 0 }}>
                      Iniciar sesión
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 20, lineHeight: 1.5 }}>
            Al continuar, aceptás nuestros{' '}
            <span style={{ color: '#ec4899', cursor: 'pointer', fontWeight: 600 }}>Términos y condiciones</span>
            {' '}y{' '}
            <span style={{ color: '#ec4899', cursor: 'pointer', fontWeight: 600 }}>Política de privacidad</span>.
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes bgMove { 0% { background-position: 0% 0%; } 25% { background-position: 100% 0%; } 50% { background-position: 100% 100%; } 75% { background-position: 0% 100%; } 100% { background-position: 0% 0%; } }`}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
