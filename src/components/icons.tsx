import Image from "next/image";

export function AppLogo() {
  return (
    <div style={{borderRadius: '50px', overflow: 'hidden'}}>
      <Image
        src="/media/logo.webp"
        alt="App Logo"
        width={48}
        height={48}
      />
    </div>
  );
}
