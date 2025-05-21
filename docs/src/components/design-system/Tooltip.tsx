import styles from "./Tooltip.module.css";
// Tooltip component
export function Tooltip({ content, children, isVisible }) {
  return (
    <div className={styles.tooltipContainer}>
      {children}
      {isVisible && <div className={styles.tooltip}>{content}</div>}
    </div>
  );
}
