"use client";

import { useEffect, useId, useState } from 'react';
import { Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SUPPORT } from './support-config';

type Rate = { rate: number; date: string };
let rateRequest: Promise<Rate | null> | undefined;
function referenceRate() {
  return rateRequest ??= fetch('https://api.frankfurter.dev/v2/rate/nzd/usd', { signal: AbortSignal.timeout(8000) })
    .then(async response => {
      if (!response.ok) throw new Error('Rate unavailable');
      const data = await response.json() as { rate?: unknown; date?: unknown };
      if (typeof data.rate !== "number" || typeof data.date !== "string") throw new Error("Rate unavailable");
      const age = Date.now() - Date.parse(data.date);
      if (!Number.isFinite(data.rate) || data.rate <= 0 || !Number.isFinite(age) || age < -86400000 || age > 7 * 86400000) throw new Error('Rate unavailable');
      return { rate: data.rate, date: data.date };
    }).catch(() => null);
}

export function SupportPanel({ inDialog = false }: { inDialog?: boolean }) {
  const [selection, setSelection] = useState<number | 'custom'>(2);
  const [custom, setCustom] = useState('');
  const [rate, setRate] = useState<Rate | null>(null);
  const id = useId();
  useEffect(() => { let active = true; void referenceRate().then(value => { if (active) setRate(value); }); return () => { active = false; }; }, []);
  const validCustom = /^(?:\d+)(?:\.\d{1,2})?$/.test(custom);
  const amount = selection === 'custom' ? (validCustom ? Number(custom) : 0) : selection;
  const validAmount = Number.isFinite(amount) && amount >= 0.01 && amount <= 10000;
  const estimate = (value: number) => rate ? `≈ US$${(value * rate.rate).toFixed(2)}` : `NZ$${value.toFixed(2)}`;
  const ready = Boolean(SUPPORT.paypalReceiver);
  const url = new URL('https://www.paypal.com/donate');
  url.search = new URLSearchParams({ business: SUPPORT.paypalReceiver, currency_code: 'NZD', amount: validAmount ? amount.toFixed(2) : '', item_name: 'Buy Daily Deebs a coffee' }).toString();
  return <section className={`support-card ${inDialog ? 'support-card--dialog' : ''}`}>
    {!inDialog && <><Coffee className="coffee-icon" aria-hidden="true" /><h2>Buy me a coffee</h2><p>Enjoying the trials? Help keep Daily Deebs going.</p></>}
    <div className="donation-amounts" role="group" aria-label="Choose a donation amount">
      {[1, 2, 5].map(value => <Button type="button" variant="outline" key={value} aria-pressed={selection === value} onClick={() => setSelection(value)}><strong>{estimate(value)}</strong>{rate && <span>NZ${value.toFixed(2)}</span>}</Button>)}
      <Button type="button" variant="outline" aria-pressed={selection === 'custom'} onClick={() => setSelection('custom')}>Custom amount</Button>
    </div>
    {selection === 'custom' && <div className="custom-donation"><label htmlFor={id}>Your amount (NZD)</label><Input id={id} type="number" inputMode="decimal" min="0.01" max="10000" step="0.01" value={custom} onChange={event => setCustom(event.target.value)} placeholder="NZ$" aria-invalid={custom !== '' && !validAmount} />{custom && !validAmount && <p role="alert">Enter NZ$0.01–10,000 with up to two decimal places.</p>}</div>}
    {validAmount && <p className="donation-total">Donation: <strong>NZ${amount.toFixed(2)}</strong>{rate && <span>{estimate(amount)}</span>}</p>}
    <p className="donation-note">Payments are in NZD. {rate ? 'USD is an estimate; PayPal’s conversion may differ.' : 'USD estimate unavailable.'}</p>
    {ready && validAmount ? <Button className="paypal-button" asChild><a href={url.href} target="_blank" rel="noopener noreferrer">Continue to PayPal</a></Button> : <Button className="paypal-button" disabled>{ready ? 'Enter an amount' : 'Donations open soon'}</Button>}
    {rate && <p className="rate-source"><a href="https://frankfurter.dev/" target="_blank" rel="noreferrer">Reference rate</a> · {rate.date}</p>}
  </section>;
}

export function SupportTrigger() {
  return <Dialog><DialogTrigger asChild><Button className="coffee-trigger" variant="outline"><Coffee aria-hidden="true" /><span>Buy me a coffee</span></Button></DialogTrigger><DialogContent className="support-dialog"><DialogTitle>Buy me a coffee</DialogTitle><DialogDescription>Enjoying the trials? Help keep Daily Deebs going.</DialogDescription><SupportPanel inDialog /></DialogContent></Dialog>;
}
