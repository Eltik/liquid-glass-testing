import {
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
  useId,
  useMemo,
} from "react";
import { utils } from "./impl/utils";
import {
  generateShaderDisplacementMap,
  getMap,
} from "./impl/displacement-maps";

/* ---------- Advanced SVG filter with chromatic aberration ---------- */
const AdvancedGlassFilter: React.FC<{
  id: string;
  displacementScale: number;
  aberrationIntensity: number;
  width: number;
  height: number;
  mode: "standard" | "polar" | "prominent" | "shader";
  shaderMapUrl?: string;
}> = ({
  id,
  displacementScale,
  aberrationIntensity,
  width,
  height,
  mode,
  shaderMapUrl,
}) => (
  <svg style={{ position: "absolute", width, height }} aria-hidden="true">
    <defs>
      <radialGradient id={`${id}-edge-mask`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="black" stopOpacity="0" />
        <stop
          offset={`${Math.max(30, 80 - aberrationIntensity * 2)}%`}
          stopColor="black"
          stopOpacity="0"
        />
        <stop offset="100%" stopColor="white" stopOpacity="1" />
      </radialGradient>
      <filter
        id={id}
        x="-35%"
        y="-35%"
        width="170%"
        height="170%"
        colorInterpolationFilters="sRGB"
      >
        <feImage
          id="feimage"
          x="0"
          y="0"
          width="100%"
          height="100%"
          result="DISPLACEMENT_MAP"
          href={getMap(mode, shaderMapUrl)}
          preserveAspectRatio="xMidYMid slice"
        />

        {/* Create edge mask using the displacement map itself */}
        <feColorMatrix
          in="DISPLACEMENT_MAP"
          type="matrix"
          values="0.3 0.3 0.3 0 0
                 0.3 0.3 0.3 0 0
                 0.3 0.3 0.3 0 0
                 0 0 0 1 0"
          result="EDGE_INTENSITY"
        />
        <feComponentTransfer in="EDGE_INTENSITY" result="EDGE_MASK">
          <feFuncA
            type="discrete"
            tableValues={`0 ${aberrationIntensity * 0.05} 1`}
          />
        </feComponentTransfer>

        {/* Original undisplaced image for center */}
        <feOffset in="SourceGraphic" dx="0" dy="0" result="CENTER_ORIGINAL" />

        {/* Red channel displacement with slight offset */}
        <feDisplacementMap
          in="SourceGraphic"
          in2="DISPLACEMENT_MAP"
          scale={displacementScale * (mode === "shader" ? 1 : -1)}
          xChannelSelector="R"
          yChannelSelector="B"
          result="RED_DISPLACED"
        />
        <feColorMatrix
          in="RED_DISPLACED"
          type="matrix"
          values="1 0 0 0 0
                 0 0 0 0 0
                 0 0 0 0 0
                 0 0 0 1 0"
          result="RED_CHANNEL"
        />

        {/* Green channel displacement */}
        <feDisplacementMap
          in="SourceGraphic"
          in2="DISPLACEMENT_MAP"
          scale={
            displacementScale *
            ((mode === "shader" ? 1 : -1) - aberrationIntensity * 0.05)
          }
          xChannelSelector="R"
          yChannelSelector="B"
          result="GREEN_DISPLACED"
        />
        <feColorMatrix
          in="GREEN_DISPLACED"
          type="matrix"
          values="0 0 0 0 0
                 0 1 0 0 0
                 0 0 0 0 0
                 0 0 0 1 0"
          result="GREEN_CHANNEL"
        />

        {/* Blue channel displacement with slight offset */}
        <feDisplacementMap
          in="SourceGraphic"
          in2="DISPLACEMENT_MAP"
          scale={
            displacementScale *
            ((mode === "shader" ? 1 : -1) - aberrationIntensity * 0.1)
          }
          xChannelSelector="R"
          yChannelSelector="B"
          result="BLUE_DISPLACED"
        />
        <feColorMatrix
          in="BLUE_DISPLACED"
          type="matrix"
          values="0 0 0 0 0
                 0 0 0 0 0
                 0 0 1 0 0
                 0 0 0 1 0"
          result="BLUE_CHANNEL"
        />

        {/* Combine all channels with screen blend mode for chromatic aberration */}
        <feBlend
          in="GREEN_CHANNEL"
          in2="BLUE_CHANNEL"
          mode="screen"
          result="GB_COMBINED"
        />
        <feBlend
          in="RED_CHANNEL"
          in2="GB_COMBINED"
          mode="screen"
          result="RGB_COMBINED"
        />

        {/* Add slight blur to soften the aberration effect */}
        <feGaussianBlur
          in="RGB_COMBINED"
          stdDeviation={Math.max(0.1, 0.5 - aberrationIntensity * 0.1)}
          result="ABERRATED_BLURRED"
        />

        {/* Apply edge mask to aberration effect */}
        <feComposite
          in="ABERRATED_BLURRED"
          in2="EDGE_MASK"
          operator="in"
          result="EDGE_ABERRATION"
        />

        {/* Create inverted mask for center */}
        <feComponentTransfer in="EDGE_MASK" result="INVERTED_MASK">
          <feFuncA type="table" tableValues="1 0" />
        </feComponentTransfer>
        <feComposite
          in="CENTER_ORIGINAL"
          in2="INVERTED_MASK"
          operator="in"
          result="CENTER_CLEAN"
        />

        {/* Combine edge aberration with clean center */}
        <feComposite in="EDGE_ABERRATION" in2="CENTER_CLEAN" operator="over" />
      </filter>
    </defs>
  </svg>
);

interface LiquidGlassProps {
  children?: React.ReactNode;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  padding?: string;
  cornerRadius?: number;
  displacementScale?: number;
  blurAmount?: number;
  saturation?: number;
  brightness?: number;
  contrast?: number;
  initialPosition?: { x?: number; y?: number };
  draggable?: boolean;
  minWidth?: number;
  minHeight?: number;
  aberrationIntensity?: number;
  elasticity?: number;
  globalMousePos?: { x: number; y: number };
  mouseOffset?: { x: number; y: number };
  mouseContainer?: React.RefObject<HTMLElement | null> | null;
  overLight?: boolean;
  mode?: "standard" | "polar" | "prominent" | "shader";
  onClick?: () => void;
  frosted?: boolean;
}

const LiquidGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(
  (
    {
      children,
      width,
      height,
      className = "",
      style = {},
      padding = "24px 32px",
      cornerRadius = 20,
      displacementScale = 25,
      blurAmount = 0.25,
      saturation = 110,
      brightness = 105,
      contrast = 120,
      initialPosition,
      draggable = true,
      minWidth = 100,
      minHeight = 50,
      aberrationIntensity = 2,
      elasticity = 0.15,
      globalMousePos: externalGlobalMousePos,
      mouseOffset: externalMouseOffset,
      mouseContainer = null,
      overLight = false,
      mode = "standard",
      onClick,
      frosted = true,
      ...props
    },
    ref,
  ) => {
    const id = useRef(utils.generateId());
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const feImageRef = useRef<SVGFEImageElement>(null);
    const feDisplacementMapRef = useRef<SVGFEDisplacementMapElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [glassSize, setGlassSize] = useState({
      width: width ?? minWidth,
      height: height ?? minHeight,
    });
    const [position, setPosition] = useState({
      x: initialPosition?.x ?? 0,
      y: initialPosition?.y ?? 0,
      centered: !initialPosition,
    });
    const [isDragging, setIsDragging] = useState(false);
    const [contentMeasured, setContentMeasured] = useState(false);

    // New state from example 2
    const [isHovered, setIsHovered] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [shaderMapUrl, setShaderMapUrl] = useState<string>("");
    const [internalGlobalMousePos, setInternalGlobalMousePos] = useState({
      x: 0,
      y: 0,
    });
    const [internalMouseOffset, setInternalMouseOffset] = useState({
      x: 0,
      y: 0,
    });

    // Use external mouse position if provided, otherwise use internal
    const globalMousePos = externalGlobalMousePos ?? internalGlobalMousePos;
    const mouseOffset = externalMouseOffset ?? internalMouseOffset;

    const canvasDPI = 1;
    const offset = 10; // Viewport boundary offset
    const filterId = useId();

    // Fragment shader function - creates the liquid glass distortion
    const fragmentShader = useCallback((uv: { x: number; y: number }) => {
      const ix = uv.x - 0.5;
      const iy = uv.y - 0.5;
      const distanceToEdge = utils.roundedRectSDF(ix, iy, 0.3, 0.2, 0.6);
      const displacement = utils.smoothStep(0.8, 0, distanceToEdge - 0.15);
      const scaled = utils.smoothStep(0, 1, displacement);
      return utils.texture(ix * scaled + 0.5, iy * scaled + 0.5);
    }, []);

    // Update shader displacement map
    const updateShader = useCallback(() => {
      const canvas = canvasRef.current;
      const feImage = feImageRef.current;
      const feDisplacementMap = feDisplacementMapRef.current;

      if (!canvas || !feImage || !feDisplacementMap) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      const w = Math.floor(glassSize.width * canvasDPI);
      const h = Math.floor(glassSize.height * canvasDPI);
      const data = new Uint8ClampedArray(w * h * 4);

      let maxScale = 0;
      const rawValues: number[] = [];

      // Generate displacement map
      for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % w;
        const y = Math.floor(i / 4 / w);
        const pos = fragmentShader({ x: x / w, y: y / h });
        const dx = pos.x * w - x;
        const dy = pos.y * h - y;
        maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
        rawValues.push(dx, dy);
      }

      maxScale *= 0.5;

      // Encode displacement values to RGB
      let index = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = (rawValues[index++] ?? 0) / maxScale + 0.5;
        const g = (rawValues[index++] ?? 0) / maxScale + 0.5;
        data[i] = r * 255;
        data[i + 1] = g * 255;
        data[i + 2] = 0;
        data[i + 3] = 255;
      }

      // Update canvas and SVG filter
      context.putImageData(new ImageData(data, w, h), 0, 0);
      if (feImage && feDisplacementMap) {
        feImage.setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "href",
          canvas.toDataURL(),
        );
        feDisplacementMap.setAttribute(
          "scale",
          (displacementScale / canvasDPI).toString(),
        );
      }
    }, [
      glassSize.width,
      glassSize.height,
      fragmentShader,
      canvasDPI,
      displacementScale,
    ]);

    // Parse padding values to get numeric values
    const getPaddingValues = useCallback(
      (
        paddingStr: string,
      ): { top: number; right: number; bottom: number; left: number } => {
        const values = paddingStr
          .split(" ")
          .map((v) => parseInt(v.replace("px", "")) || 0);
        if (values.length === 1)
          return {
            top: values[0]!,
            right: values[0]!,
            bottom: values[0]!,
            left: values[0]!,
          };
        if (values.length === 2)
          return {
            top: values[0]!,
            right: values[1]!,
            bottom: values[0]!,
            left: values[1]!,
          };
        if (values.length === 4)
          return {
            top: values[0]!,
            right: values[1]!,
            bottom: values[2]!,
            left: values[3]!,
          };
        return { top: 24, right: 32, bottom: 24, left: 32 }; // default
      },
      [],
    );

    // Update glass size based on content
    const updateGlassSize = useCallback(() => {
      if (!measureRef.current || !children) return;

      // Wait for next frame to ensure content is rendered
      requestAnimationFrame(() => {
        if (!measureRef.current) return;

        const contentRect = measureRef.current.getBoundingClientRect();
        const paddingValues = getPaddingValues(padding);

        // If width/height are explicitly provided, use them
        if (width && height) {
          const newSize = { width, height };
          if (
            newSize.width !== glassSize.width ||
            newSize.height !== glassSize.height
          ) {
            setGlassSize(newSize);
          }
          return;
        }

        // Calculate size based on content + padding
        const contentWidth = contentRect.width;
        const contentHeight = contentRect.height;

        const totalWidth =
          contentWidth + paddingValues.left + paddingValues.right;
        const totalHeight =
          contentHeight + paddingValues.top + paddingValues.bottom;

        const newWidth = width ?? Math.max(totalWidth, minWidth);
        const newHeight = height ?? Math.max(totalHeight, minHeight);

        if (
          Math.abs(newWidth - glassSize.width) > 1 ||
          Math.abs(newHeight - glassSize.height) > 1
        ) {
          setGlassSize({ width: newWidth, height: newHeight });
          setContentMeasured(true);
        }
      });
    }, [
      width,
      height,
      glassSize.width,
      glassSize.height,
      padding,
      children,
      minWidth,
      minHeight,
      getPaddingValues,
    ]);

    // Constrain position within viewport bounds
    const constrainPosition = useCallback(
      (x: number, y: number) => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const minX = offset;
        const maxX = viewportWidth - glassSize.width - offset;
        const minY = offset;
        const maxY = viewportHeight - glassSize.height - offset;

        const constrainedX = Math.max(minX, Math.min(maxX, x));
        const constrainedY = Math.max(minY, Math.min(maxY, y));

        return { x: constrainedX, y: constrainedY };
      },
      [glassSize.width, glassSize.height, offset],
    );

    // Internal mouse tracking from example 2
    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        const container = mouseContainer?.current ?? containerRef.current;
        if (!container) {
          return;
        }

        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        setInternalMouseOffset({
          x: ((e.clientX - centerX) / rect.width) * 100,
          y: ((e.clientY - centerY) / rect.height) * 100,
        });

        setInternalGlobalMousePos({
          x: e.clientX,
          y: e.clientY,
        });
      },
      [mouseContainer],
    );

    // Calculate directional scaling based on mouse position from example 2 (optimized)
    const calculateDirectionalScale = useCallback(() => {
      // Skip expensive calculations during drag for better performance
      if (isDragging) {
        return "scale(1)";
      }

      if (!globalMousePos.x || !globalMousePos.y || !containerRef.current) {
        return "scale(1)";
      }

      const rect = containerRef.current.getBoundingClientRect();
      const pillCenterX = rect.left + rect.width / 2;
      const pillCenterY = rect.top + rect.height / 2;
      const pillWidth = glassSize.width;
      const pillHeight = glassSize.height;

      const deltaX = globalMousePos.x - pillCenterX;
      const deltaY = globalMousePos.y - pillCenterY;

      // Calculate distance from mouse to pill edges (not center)
      const edgeDistanceX = Math.max(0, Math.abs(deltaX) - pillWidth / 2);
      const edgeDistanceY = Math.max(0, Math.abs(deltaY) - pillHeight / 2);
      const edgeDistance = Math.sqrt(
        edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY,
      );

      // Activation zone: 200px from edges
      const activationZone = 200;

      // If outside activation zone, no effect
      if (edgeDistance > activationZone) {
        return "scale(1)";
      }

      // Calculate fade-in factor (1 at edge, 0 at activation zone boundary)
      const fadeInFactor = 1 - edgeDistance / activationZone;

      // Normalize the deltas for direction
      const centerDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (centerDistance === 0) {
        return "scale(1)";
      }

      const normalizedX = deltaX / centerDistance;
      const normalizedY = deltaY / centerDistance;

      // Calculate stretch factors with fade-in
      const stretchIntensity =
        Math.min(centerDistance / 300, 1) * (elasticity ?? 0.15) * fadeInFactor;

      // X-axis scaling: stretch horizontally when moving left/right, compress when moving up/down
      const scaleX =
        1 +
        Math.abs(normalizedX) * stretchIntensity * 0.3 -
        Math.abs(normalizedY) * stretchIntensity * 0.15;

      // Y-axis scaling: stretch vertically when moving up/down, compress when moving left/right
      const scaleY =
        1 +
        Math.abs(normalizedY) * stretchIntensity * 0.3 -
        Math.abs(normalizedX) * stretchIntensity * 0.15;

      return `scaleX(${Math.max(0.8, scaleX)}) scaleY(${Math.max(0.8, scaleY)})`;
    }, [globalMousePos, elasticity, glassSize, isDragging]);

    // Helper function to calculate fade-in factor based on distance from element edges (optimized)
    const calculateFadeInFactor = useCallback(() => {
      // Skip expensive calculations during drag for better performance
      if (isDragging) {
        return 0;
      }

      if (!globalMousePos.x || !globalMousePos.y || !containerRef.current) {
        return 0;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const pillCenterX = rect.left + rect.width / 2;
      const pillCenterY = rect.top + rect.height / 2;
      const pillWidth = glassSize.width;
      const pillHeight = glassSize.height;

      const edgeDistanceX = Math.max(
        0,
        Math.abs(globalMousePos.x - pillCenterX) - pillWidth / 2,
      );
      const edgeDistanceY = Math.max(
        0,
        Math.abs(globalMousePos.y - pillCenterY) - pillHeight / 2,
      );
      const edgeDistance = Math.sqrt(
        edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY,
      );

      const activationZone = 200;
      return edgeDistance > activationZone
        ? 0
        : 1 - edgeDistance / activationZone;
    }, [globalMousePos, glassSize, isDragging]);

    // Helper function to calculate elastic translation (optimized)
    const calculateElasticTranslation = useCallback(() => {
      // Skip expensive calculations during drag for better performance
      if (isDragging || !containerRef.current) {
        return { x: 0, y: 0 };
      }

      const fadeInFactor = calculateFadeInFactor();
      const rect = containerRef.current.getBoundingClientRect();
      const pillCenterX = rect.left + rect.width / 2;
      const pillCenterY = rect.top + rect.height / 2;

      return {
        x:
          (globalMousePos.x - pillCenterX) *
          (elasticity ?? 0.15) *
          0.1 *
          fadeInFactor,
        y:
          (globalMousePos.y - pillCenterY) *
          (elasticity ?? 0.15) *
          0.1 *
          fadeInFactor,
      };
    }, [globalMousePos, elasticity, calculateFadeInFactor, isDragging]);

    // Handle drag functionality with improved performance
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (!draggable) return;

        // Prevent dragging if user is interacting with form controls
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "BUTTON" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT"
        ) {
          return;
        }

        // Also check if the target is inside a form control
        if (target.closest("input, button, textarea, select")) {
          return;
        }

        setIsDragging(true);
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const initialX = rect.left;
        const initialY = rect.top;

        let animationId: number | null = null;
        let lastUpdateTime = 0;

        const handleDragMove = (e: MouseEvent) => {
          const now = performance.now();

          // Throttle updates to ~60fps for smooth performance
          if (now - lastUpdateTime < 16) {
            return;
          }
          lastUpdateTime = now;

          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;

          const newX = initialX + deltaX;
          const newY = initialY + deltaY;

          const constrained = constrainPosition(newX, newY);

          // Use requestAnimationFrame for smooth updates
          if (animationId) {
            cancelAnimationFrame(animationId);
          }

          animationId = requestAnimationFrame(() => {
            setPosition({
              x: constrained.x,
              y: constrained.y,
              centered: false,
            });
          });
        };

        const handleDragEnd = () => {
          setIsDragging(false);
          if (animationId) {
            cancelAnimationFrame(animationId);
          }
          document.removeEventListener("mousemove", handleDragMove);
          document.removeEventListener("mouseup", handleDragEnd);
        };

        document.addEventListener("mousemove", handleDragMove);
        document.addEventListener("mouseup", handleDragEnd);

        e.preventDefault();
      },
      [draggable, constrainPosition],
    );

    // Generate shader displacement map when in shader mode
    useEffect(() => {
      if (mode === "shader") {
        const url = generateShaderDisplacementMap(
          glassSize.width,
          glassSize.height,
        );
        setShaderMapUrl(url);
      }
    }, [mode, glassSize.width, glassSize.height]);

    // Set up mouse tracking if no external mouse position is provided
    useEffect(() => {
      if (externalGlobalMousePos && externalMouseOffset) {
        // External mouse tracking is provided, don't set up internal tracking
        return;
      }

      const container = mouseContainer?.current ?? containerRef.current;
      if (!container) {
        return;
      }

      container.addEventListener("mousemove", handleMouseMove);

      return () => {
        container.removeEventListener("mousemove", handleMouseMove);
      };
    }, [
      handleMouseMove,
      mouseContainer,
      externalGlobalMousePos,
      externalMouseOffset,
    ]);

    // Setup canvas and initial shader update
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = Math.floor(glassSize.width * canvasDPI);
      canvas.height = Math.floor(glassSize.height * canvasDPI);

      updateShader();
    }, [glassSize.width, glassSize.height, canvasDPI, updateShader]);

    // Update glass size when width/height props change
    useEffect(() => {
      if (width && height) {
        setGlassSize({ width, height });
      } else {
        updateGlassSize();
      }
    }, [width, height, updateGlassSize]);

    // Initial size measurement
    useEffect(() => {
      if (children && !contentMeasured) {
        // Delay initial measurement to ensure DOM is ready
        const timeout = setTimeout(() => {
          updateGlassSize();
        }, 0);

        return () => clearTimeout(timeout);
      }
    }, [children, contentMeasured, updateGlassSize]);

    // Set up ResizeObserver for content changes
    useEffect(() => {
      if (!measureRef.current || !children) return;

      if ("ResizeObserver" in window) {
        const resizeObserver = new ResizeObserver(() => {
          // Debounce updates to avoid excessive recalculations
          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
          }
          resizeTimeoutRef.current = setTimeout(() => {
            updateGlassSize();
          }, 16); // ~60fps
        });

        resizeObserver.observe(measureRef.current);

        return () => {
          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
          }
          resizeObserver.disconnect();
        };
      }

      // Fallback for browsers without ResizeObserver
      const interval = setInterval(updateGlassSize, 100);
      return () => clearInterval(interval);
    }, [updateGlassSize, children]);

    // Handle window resize to maintain constraints
    useEffect(() => {
      const handleResize = () => {
        if (!position.centered) {
          const constrained = constrainPosition(position.x, position.y);
          if (position.x !== constrained.x || position.y !== constrained.y) {
            setPosition({
              x: constrained.x,
              y: constrained.y,
              centered: false,
            });
          }
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [position, constrainPosition]);

    // Enhanced container styles with elastic effects (optimized for drag performance)
    const elasticTranslation = useMemo(
      () => calculateElasticTranslation(),
      [calculateElasticTranslation],
    );
    const directionalScale = useMemo(
      () => calculateDirectionalScale(),
      [calculateDirectionalScale],
    );

    const transformStyle = draggable
      ? position.centered
        ? isDragging
          ? "translate(-50%, -50%)" // Disable elastic effects during drag for performance
          : `translate(calc(-50% + ${elasticTranslation.x}px), calc(-50% + ${elasticTranslation.y}px)) ${isActive && Boolean(onClick) ? "scale(0.96)" : directionalScale}`
        : isDragging
          ? "none" // Disable elastic effects during drag for performance
          : `translate(${elasticTranslation.x}px, ${elasticTranslation.y}px) ${isActive && Boolean(onClick) ? "scale(0.96)" : directionalScale}`
      : position.centered
        ? "translate(-50%, -50%)"
        : "none";

    const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");

    const backdropStyle: React.CSSProperties = frosted
      ? {
          ...(isFirefox ? {} : { filter: `url(#${filterId})` }),
          backdropFilter: `blur(${(overLight ? 12 : 4) + blurAmount * 32}px) saturate(${saturation}%)`,
        }
      : {
          backdropFilter: `url(#${id.current}_filter) blur(${blurAmount}px) contrast(${contrast}%) brightness(${brightness}%) saturate(${saturation}%)`,
        };

    const containerStyle: React.CSSProperties = {
      width: glassSize.width,
      height: glassSize.height,
      overflow: "hidden",
      borderRadius: `${cornerRadius}px`,
      boxShadow: frosted
        ? overLight
          ? "0px 16px 70px rgba(0, 0, 0, 0.75)"
          : "0px 12px 40px rgba(0, 0, 0, 0.25)"
        : "0 4px 8px rgba(0, 0, 0, 0.25), 0 -10px 25px inset rgba(0, 0, 0, 0.15)",
      cursor: draggable
        ? isDragging
          ? "grabbing"
          : "grab"
        : onClick
          ? "pointer"
          : "default",
      pointerEvents: "auto",
      transition: isDragging ? "none" : "all 0.2s ease-in-out", // Disable transitions during drag for smooth performance
      ...(position.centered
        ? {
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: transformStyle,
            zIndex: 9999,
          }
        : {
            position: "fixed",
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: transformStyle,
            zIndex: 9999,
          }),
      ...style,
    };

    const contentStyle: React.CSSProperties = {
      padding,
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    };

    // Invisible measuring div that sizes naturally to content
    const measureStyle: React.CSSProperties = {
      position: "absolute",
      visibility: "hidden",
      pointerEvents: "none",
      top: "-9999px",
      left: "-9999px",
      whiteSpace: "nowrap",
      display: "inline-block",
    };

    return (
      <>
        {/* Hidden measuring div for natural content sizing */}
        {children && !width && !height && (
          <div ref={measureRef} style={measureStyle}>
            {children}
          </div>
        )}

        {/* Hidden canvas for displacement map generation (legacy) */}
        <canvas
          ref={canvasRef}
          style={{ display: "none" }}
          width={Math.floor(glassSize.width * canvasDPI)}
          height={Math.floor(glassSize.height * canvasDPI)}
        />

        {/* Conditional SVG filters based on frosted prop */}
        {frosted ? (
          <AdvancedGlassFilter
            mode={mode}
            id={filterId}
            displacementScale={
              overLight ? displacementScale * 0.5 : displacementScale
            }
            aberrationIntensity={aberrationIntensity}
            width={glassSize.width}
            height={glassSize.height}
            shaderMapUrl={shaderMapUrl}
          />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="0"
            height="0"
            className="pointer-events-none fixed top-0 left-0 z-[9998]"
          >
            <defs>
              <filter
                id={`${id.current}_filter`}
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
                x="0"
                y="0"
                width={glassSize.width.toString()}
                height={glassSize.height.toString()}
              >
                <feImage
                  ref={feImageRef}
                  id={`${id.current}_map`}
                  width={glassSize.width.toString()}
                  height={glassSize.height.toString()}
                />
                <feDisplacementMap
                  ref={feDisplacementMapRef}
                  in="SourceGraphic"
                  in2={`${id.current}_map`}
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
            </defs>
          </svg>
        )}

        {/* Over light effect layers */}
        {overLight && (
          <>
            <div
              className="pointer-events-none bg-black transition-all duration-150 ease-in-out"
              style={{
                ...containerStyle,
                opacity: 0.2,
                boxShadow: "none",
                backdropFilter: "none",
                cursor: "default",
              }}
            />
            <div
              className="pointer-events-none bg-black transition-all duration-150 ease-in-out"
              style={{
                ...containerStyle,
                opacity: 1,
                mixBlendMode: "overlay",
                boxShadow: "none",
                backdropFilter: "none",
                cursor: "default",
              }}
            />
          </>
        )}

        {/* Main liquid glass container */}
        <div
          ref={(el) => {
            containerRef.current = el;
            if (typeof ref === "function") {
              ref(el);
            } else if (ref) {
              ref.current = el;
            }
          }}
          className={`relative ${className} ${isActive ? "active" : ""} ${Boolean(onClick) ? "cursor-pointer" : ""}`}
          style={containerStyle}
          onMouseDown={handleMouseDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseUp={() => setIsActive(false)}
          onClick={onClick}
          {...props}
        >
          {/* Backdrop layer that gets the warp effect */}
          <span className="absolute inset-0" style={backdropStyle} />

          {/* User content stays sharp */}
          <div
            ref={contentRef}
            style={{
              ...contentStyle,
              position: "relative",
              zIndex: 1,
              color: "white",
              fontWeight: 500,
              fontSize: "20px",
              lineHeight: 1,
              fontFamily: "system-ui",
              textShadow: overLight
                ? "0px 2px 12px rgba(0, 0, 0, 0)"
                : "0px 2px 12px rgba(0, 0, 0, 0.4)",
              transition: "all 150ms ease-in-out",
            }}
          >
            {children}
          </div>
        </div>

        {/* Conditional enhanced visual effects - only show for frosted glass */}
        {frosted && (
          <>
            {/* Enhanced border layers with dynamic gradients */}
            <span
              style={{
                ...containerStyle,
                pointerEvents: "none",
                mixBlendMode: "screen",
                opacity: 0.2,
                padding: "1.5px",
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                boxShadow:
                  "0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)",
                background: `linear-gradient(
                  ${135 + (mouseOffset?.x ?? 0) * 1.2}deg,
                  rgba(255, 255, 255, 0.0) 0%,
                  rgba(255, 255, 255, ${0.12 + Math.abs(mouseOffset?.x ?? 0) * 0.008}) ${Math.max(10, 33 + (mouseOffset?.y ?? 0) * 0.3)}%,
                  rgba(255, 255, 255, ${0.4 + Math.abs(mouseOffset?.x ?? 0) * 0.012}) ${Math.min(90, 66 + (mouseOffset?.y ?? 0) * 0.4)}%,
                  rgba(255, 255, 255, 0.0) 100%
                )`,
              }}
            />

            <span
              style={{
                ...containerStyle,
                pointerEvents: "none",
                mixBlendMode: "overlay",
                padding: "1.5px",
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                boxShadow:
                  "0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)",
                background: `linear-gradient(
                  ${135 + (mouseOffset?.x ?? 0) * 1.2}deg,
                  rgba(255, 255, 255, 0.0) 0%,
                  rgba(255, 255, 255, ${0.32 + Math.abs(mouseOffset?.x ?? 0) * 0.008}) ${Math.max(10, 33 + (mouseOffset?.y ?? 0) * 0.3)}%,
                  rgba(255, 255, 255, ${0.6 + Math.abs(mouseOffset?.x ?? 0) * 0.012}) ${Math.min(90, 66 + (mouseOffset?.y ?? 0) * 0.4)}%,
                  rgba(255, 255, 255, 0.0) 100%
                )`,
              }}
            />

            {/* Interactive hover and click effects */}
            {Boolean(onClick) && (
              <>
                <div
                  style={{
                    ...containerStyle,
                    width: glassSize.width + 1,
                    pointerEvents: "none",
                    transition: "all 0.2s ease-out",
                    opacity: isHovered || isActive ? 0.5 : 0,
                    backgroundImage:
                      "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 50%)",
                    mixBlendMode: "overlay",
                    boxShadow: "none",
                    backdropFilter: "none",
                  }}
                />
                <div
                  style={{
                    ...containerStyle,
                    width: glassSize.width + 1,
                    pointerEvents: "none",
                    transition: "all 0.2s ease-out",
                    opacity: isActive ? 0.5 : 0,
                    backgroundImage:
                      "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 80%)",
                    mixBlendMode: "overlay",
                    boxShadow: "none",
                    backdropFilter: "none",
                  }}
                />
                <div
                  style={{
                    ...containerStyle,
                    width: glassSize.width + 1,
                    pointerEvents: "none",
                    transition: "all 0.2s ease-out",
                    opacity: isHovered ? 0.4 : isActive ? 0.8 : 0,
                    backgroundImage:
                      "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%)",
                    mixBlendMode: "overlay",
                    boxShadow: "none",
                    backdropFilter: "none",
                  }}
                />
              </>
            )}
          </>
        )}
      </>
    );
  },
);

LiquidGlass.displayName = "LiquidGlass";

export default LiquidGlass;
