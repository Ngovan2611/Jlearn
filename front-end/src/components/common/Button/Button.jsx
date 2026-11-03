function Button({
  children,
  variant = "",
  className = "",
  onClick,
  type = "button",
}) {
  return (
    <button
      type={type}
      className={`neu-button ${variant} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;