const Button = ({ children, ...props }) => (
  <button
    style={{
      padding: "12px 20px",
      fontSize: "16px",
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      marginTop: "1rem",
    }}
    {...props}
  >
    {children}
  </button>
);

export default Button;
