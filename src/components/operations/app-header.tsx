import Image from "next/image";
import Link from "next/link";
import styles from "./app-header.module.css";

type EventNavigation = {
  id: string;
  name: string;
  reference: string;
};

type AppHeaderProps = {
  active?: "events" | "control" | "incidents" | "radios";
  event?: EventNavigation;
  incidentId?: string;
};

export function AppHeader({ active = "events", event, incidentId }: AppHeaderProps) {
  const eventPath = event ? `/events/${event.id}` : null;

  return (
    <header className={styles.header}>
      <Link className={styles.logoLink} href={eventPath ? `${eventPath}/control` : "/select-event"} aria-label="Sentinel Event Control">
        <Image
          src="/branding/sentinel-logo.png"
          width={2172}
          height={724}
          sizes="(max-width: 760px) 180px, 216px"
          alt="Sentinel, event incident management platform"
          priority
        />
      </Link>
      <nav className={styles.navigation} aria-label="Application navigation">
        <NavLink active={active === "events"} href="/select-event">Events</NavLink>
        {eventPath ? <>
          <NavLink active={active === "control"} href={`${eventPath}/control`}>Event Control</NavLink>
          <NavLink active={active === "incidents"} href={incidentId ? `${eventPath}/incidents/${incidentId}` : `${eventPath}/control`}>Incidents</NavLink>
          <NavLink active={active === "radios"} href={`${eventPath}/radios`}>Radios</NavLink>
          <NavLink active={false} href={`${eventPath}/control#operational-log`}>Operational log</NavLink>
        </> : null}
      </nav>
      <div className={styles.utility}>
        {event ? <span className={styles.eventContext}>{event.reference}</span> : null}
        <Link href="/sign-in">Account</Link>
      </div>
    </header>
  );
}

function NavLink({ active, children, href }: { active: boolean; children: React.ReactNode; href: string }) {
  return <Link className={active ? styles.current : undefined} href={href} aria-current={active ? "page" : undefined}>{children}</Link>;
}
