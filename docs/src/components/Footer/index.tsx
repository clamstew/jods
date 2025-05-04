import React from "react";
import { FooterLinks } from "./FooterLinks";
import { FooterMascots } from "./FooterMascots";
import { FooterCopyright } from "./FooterCopyright";
import { FooterBackground } from "./FooterBackground";

export default function Footer(): React.ReactElement {
  return (
    <footer className="footer">
      {/* Background effects */}
      <FooterBackground />

      {/* Main content */}
      <FooterLinks />

      {/* Signature section */}
      <div className="footer__signature">
        <FooterMascots />
        <FooterCopyright />
      </div>
    </footer>
  );
}
