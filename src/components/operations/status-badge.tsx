import { severityOf, statusOf, type Tone } from "@/modules/incidents/vocabulary";
import styles from "./status-badge.module.css";

/**
 * Shared status and severity badges.
 *
 * Every operational screen renders incident state through these components so a
 * given status keeps one colour and one label platform-wide, and so meaning is
 * never carried by colour alone.
 */

const toneClass: Record<Tone, string> = {
  grey: styles.grey,
  blue: styles.blue,
  teal: styles.teal,
  green: styles.green,
  yellow: styles.yellow,
  orange: styles.orange,
  red: styles.red,
  purple: styles.purple,
};

export function StatusBadge({ value, title }: { value: string; title?: string }) {
  const status = statusOf(value);
  const badge = (
    <span className={`${styles.badge} ${toneClass[status.tone]}`} title={status.meaning}>
      <span className={styles.label}>{status.label}</span>
    </span>
  );
  return title ? withTitle(title, badge) : badge;
}

export function SeverityBadge({ value, title }: { value: string; title?: string }) {
  const severity = severityOf(value);
  const badge = (
    <span className={`${styles.badge} ${toneClass[severity.tone]}`} title={severity.meaning}>
      <span aria-hidden className={styles.pips}>
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className={`${styles.pip} ${step <= severity.rank ? styles.pipFilled : ""}`} />
        ))}
      </span>
      <span className={styles.label}>{severity.label}</span>
    </span>
  );
  return title ? withTitle(title, badge) : badge;
}

/** Generic badge for states outside the incident lifecycle, such as access class. */
export function StateBadge({ label, tone, title }: { label: string; tone: Tone; title?: string }) {
  const badge = (
    <span className={`${styles.badge} ${toneClass[tone]}`}>
      <span className={styles.label}>{label}</span>
    </span>
  );
  return title ? withTitle(title, badge) : badge;
}

function withTitle(title: string, badge: React.ReactNode) {
  return (
    <span className={styles.titled}>
      <span className={styles.titledLabel}>{title}</span>
      {badge}
    </span>
  );
}
