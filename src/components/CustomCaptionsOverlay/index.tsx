import { forwardRef } from "react";
import "./styles.css";

interface CustomCaptionsOverlayProps
  extends React.HTMLAttributes<HTMLDivElement> {
  overlayStyle?: React.CSSProperties;
  children?: React.ReactNode;
}

const CustomCaptionsOverlay = forwardRef<
  HTMLDivElement,
  CustomCaptionsOverlayProps
>(({ overlayStyle, children, ...rest }, ref) => {
  return (
    <div
      ref={ref}
      className="custom-captions-overlay"
      style={overlayStyle}
      {...rest}
    >
      {children}
    </div>
  );
});

export default CustomCaptionsOverlay;
