interface LogoProps {
  className?: string;
}

export function CerviScreenLogo(props: LogoProps) {
  const className = props.className || "w-80 h-auto";
  
  return (
    <img 
      src="/cerviscreen-logo.png" 
      alt="CerviScreen Logo" 
      className={className}
    />
  );
}

export function CerviScreenIcon(props: LogoProps) {
  const className = props.className || "w-12 h-12";
  
  return (
    <img 
      src="/cerviscreen-logo.png" 
      alt="CerviScreen" 
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}