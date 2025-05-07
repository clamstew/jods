import React from "react";
import { FooterLinks } from "./FooterLinks";
import { FooterMascots } from "./FooterMascots";
import { FooterCopyright } from "./FooterCopyright";
import { FooterBackground } from "./FooterBackground";
import styles from "./Footer.module.css";

export default function Footer(): React.ReactElement {
  return (
    <footer className={styles.footer} data-testid="jods-footer">
      {/* Background effects */}
      <FooterBackground />

      {/* Main content */}
      <FooterLinks />

      {/* Signature section */}
      <div className={styles.signature}>
        <FooterMascots />
        <FooterCopyright />
      </div>
    </footer>
  );
}
