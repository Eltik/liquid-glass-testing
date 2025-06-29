export const displacementMap =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAZABkAAD/2wCEAAQDAwMDAwQDAwQGBAMEBgcFBAQFBwgHBwcHBwgLCAkJCQkICwsMDAwMDAsNDQ4ODQ0SEhISEhQUFBQUFBQUFBQBBQUFCAgIEAsLEBQODg4UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFP/CABEIAQABAAMBEQACEQEDEQH/xAAxAAEBAQEBAQAAAAAAAAAAAAADAgQIAQYBAQEBAQEBAQAAAAAAAAAAAAMCBAEACAf/2gAMAwEAAhADEAAAAPjPor6kOgOiKhKgKhKgOhKhOhKxKgKhOgKhKhKgKxOhKhOgKhKhKgKwKhKgKgKwG841nns9J/nn2KVCdCdCVAVCVCVAdCVCdiVAVidCVAVCVAdiVCVCdAVCVCVAVCVAVAViVZxsBrPPY6R/NvsY6E6ErEqAqE6ErAqE6E7E7ErA0ErArAqAqEuiVAXRLol0S6J0JUBWBUI0BXnG88djpH81+xjoToSoSoCoTsSoYQTsTsTQSsCsCsCsCsCoC6A0JeAuiXSLwn0SoioCoCoBsBrPFH0j+a/Yx0J0JUJUJ2BUMIR2MIRoBoJIBXnJAK840BUA0BdAegXhL";

export const polarDisplacementMap =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAZABkAAD/2wCEAAYEBAQFBAYFBQYJBgUGCQsIBgYICwwKCgsKCgwQDAwMDAwMEAwODxAPDgwTExQUExMcGxsbHB8fHx8fHx8fHx8BBwcHDQwNGBAQGBoVERUaHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fH//CABEIAQABAAMBEQACEQEDEQH/xAAxAAADAQEBAAAAAAAAAAAAAAABAgMABAcBAAMBAQEBAAAAAAAAAAAAAAIDBAEABQb/2gAMAwEAAhADEAAAAPG/tfu93bu3bs7d27t3bu2du7d27h3bs3du7d27t3bc3du7d27tvbu3du7d27T3E+2du05u7tm7O2cM7d2zt3Du2YOzbw7N3bcHZt7dm3tvbeO9u7dx3d3Ht3cS05pzd24dOds0Z2HdnDsGdswdg7hw7cHYNzbg3NvbcO9izbx3TvbtPae09pLTmnCObh3ZuHcO4eGcM4ZgzB2DhHYOEbg0QWbcxZtzFmLjvEuO6e07p4jmsWnCOERIiWHcO4NA8M4DwzBmLgjsXRHCNEEI0QQ4sxZjwlxLjvEtPa2keJuJt04bCREsJECw6A3BoHFHhmKIrmLwjQXRGgpCCHEIMcWE8x4S1i4lraR7W02wnIiJsJkTIFg3AWXoHgGqGAcXBTBXhXgXQUgBADAGIMceE8J4T4lrFraTaT6TYbabiZFjAeAissBBegNAcq8UcXBXATBX";

export const prominentDisplacementMap =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAABVXElEQVR4nO19aZasPKxkuE5toffS+1/YR/8AS6GQZAxZd3qvffJQtjEe5AgNQGaN//N/caZxAAAODFyZsnLcnZIGz47UiVVeNeWpWDlmJbhILW8rv7oaYBz4SpWS+ZJKuwofHMeVH8DXoFMjVHpmXFdJpR1zzRipWFUiVYJaIlVCLpynQO0fHRE7uQ5Vg/JUUQl8TfyeoAXGzJyVI1aemVGdSg24WXtEPKYLdWJ0lQ4HHOdnIKdjzLP04eGsZ+4csbeDelukY3XyfVqO6Ts6ciWdGtyIQKOfajAjlXVneAL1HCCYpzGy1O9xn4fDI/RLe6r6YhxkqKECes0BaZBwoFgHXZV4pVBrRufKg4U1LzHckwwSYSrQBy2ANh1RSkXLNWxvU7qcEQPUSM2XOqYjGQTQRQOB3UQVVwT8WauIvzBtsQZpcFlT2tiI9Y3RS25gmlM844DtdOSANkhHNC35KKbALj9AGYFanCrguAe1KVJFBk4lB9Qu7ej71xy4u3DkzNCa3M0C9N3ozgSqYmIMqhzDL/EpRaDL1o9UA9SmYFRtHP2ZGFIpg5oL9JIDdCo36Jhw5LPwOeyYgtII5KLN8yBWiC/ELTGUBsdz6LMxDOsKuFum4Q40WJaj7mBNA2GCQm1WDkL5IKco9Euw1uIInd8r/nTK8jsu0KhGeYF+DHxZB7ccCGcZyjMVHtGaC";

// Generate shader-based displacement map using shader utilities
export const generateShaderDisplacementMap = (width: number, height: number): string => {
  const { ShaderDisplacementGenerator, fragmentShaders } = require('./utils');
  
  const generator = new ShaderDisplacementGenerator({
    width,
    height,
    fragment: fragmentShaders.liquidGlass,
  });

  const dataUrl = generator.updateShader();
  generator.destroy();

  return dataUrl;
};

export const getMap = (mode: "standard" | "polar" | "prominent" | "shader", shaderMapUrl?: string) => {
  switch (mode) {
    case "standard":
      return displacementMap;
    case "polar":
      return polarDisplacementMap;
    case "prominent":
      return prominentDisplacementMap;
    case "shader":
      return shaderMapUrl || displacementMap;
    default:
      throw new Error(`Invalid mode: ${mode}`);
  }
}; 