import {PublicProfessionalBooking} from './PublicProfessionalBooking';
import {PublicSubscriptionReturn} from './PublicFollowPlans';
import {TeamWorkspace} from './TeamWorkspace';
import './nutrigo.css';
import './nutrigo-fidelity.css';
import './standalone-workspace.css';
export function StandaloneWorkspace({slug,subscriptionId,darkMode=false,onSignOut}:{slug?:string;subscriptionId?:string;darkMode?:boolean;onSignOut?:()=>void}){
 return <div className={`nv-app nv-standalone${darkMode?' nv-dark':''}`}><header><a href="/">Plan V</a>{onSignOut&&<button onClick={onSignOut}>Cerrar sesión</button>}</header><main>{slug&&subscriptionId?<PublicSubscriptionReturn slug={slug} id={subscriptionId}/>:slug?<PublicProfessionalBooking slug={slug}/>:<TeamWorkspace/>}</main></div>;
}
