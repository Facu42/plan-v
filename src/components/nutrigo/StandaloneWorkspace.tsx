import {PublicProfessionalBooking} from './PublicProfessionalBooking';
import {PublicSubscriptionReturn} from './PublicFollowPlans';
import { useState, type ReactNode } from 'react';
import { canLeaveWorkspace } from './unsaved-changes';
import { PanelEquipo } from './PanelEquipo';
import { PanelBocetoShell } from './PanelBocetoShell';
import './nutrigo.css';
import './nutrigo-fidelity.css';
import './standalone-workspace.css';
export function StandaloneWorkspace({slug,subscriptionId,darkMode=false,onSignOut}:{slug?:string;subscriptionId?:string;darkMode?:boolean;onSignOut?:()=>void}){
 if (!slug) return <StandaloneTeam dark={darkMode} onSignOut={onSignOut}/>;
 return <div className={`nv-app nv-standalone${darkMode?' nv-dark':''}`}><header><a href="/">Plan V</a>{onSignOut&&<button onClick={onSignOut}>Cerrar sesión</button>}</header><main>{slug&&subscriptionId?<PublicSubscriptionReturn slug={slug} id={subscriptionId}/>:slug?<PublicProfessionalBooking slug={slug}/>:null}</main></div>;
}

function StandaloneTeam({ dark, onSignOut }: { dark: boolean; onSignOut?: () => void }) {
 const [actions, setActions] = useState<ReactNode>(null), [count, setCount] = useState<number | null>(null);
 return <PanelBocetoShell dark={dark} collapsed={false} onCollapse={() => {}} menuOpen={false} onMenu={() => {}} nav={<a className="nv" href="/crm/equipo">Ir al panel del consultorio</a>} brand="Plan V" name="Equipo" initials="PV" account={[]} onSignOut={onSignOut ? () => { if (canLeaveWorkspace()) onSignOut(); } : undefined} bell={null} header={{ title: `Equipo${count === null ? '' : ` · ${count} personas`}`, when: 'Cada persona ve solo lo que le habilitás · todo queda registrado', search: 'Buscar', actions }} onSearch={() => {}} tabs={[]} onOpen={href => window.location.assign(href)} onMore={() => {}} mainKey="equipo"><PanelEquipo onHeader={setActions} onCount={setCount}/></PanelBocetoShell>;
}
