declare module "canvas" {
  export function createCanvas(width: number, height: number): any;
  export function loadImage(source: Buffer): Promise<any>;
}
