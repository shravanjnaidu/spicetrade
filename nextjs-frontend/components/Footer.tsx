import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#222] text-white text-sm py-4 px-6 mt-auto text-center">
      &copy; Group of Spice Cloud Technologies, Canada, ESTB
      2022&nbsp;&nbsp;|&nbsp;&nbsp;
      <Link
        href="/faq"
        className="text-white underline hover:text-orange-300 transition-colors"
      >
        FAQ
      </Link>
    </footer>
  );
}
