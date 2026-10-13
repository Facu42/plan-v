import {PublicProfessionalBooking} from './PublicProfessionalBooking';
import {TeamWorkspace} from './TeamWorkspace';
import './nutrigo.css';
import './nutrigo-fidelity.css';
import './standalone-workspace.css';
export function StandaloneWorkspace({slug,darkMode=false,onSignOut}:{slug?:string;darkMode?:boolean;onSignOut?:()=>void}){
 return <div className={`nv-app nv-standalone${darkMode?' nv-dark':''}`}><header><a href="/">Plan V</a>{onSignOut&&<button onClick={onSignOut}>Cerrar sesión</button>}</header><main>{slug?<PublicProfessionalBooking slug={slug}/>:<TeamWorkspace/>}</main></div>;
}
