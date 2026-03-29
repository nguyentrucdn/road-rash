// src/rendering/TextureAtlas.ts
import * as THREE from 'three';
import atlasRegions from '../../public/textures/atlas-regions.json';

export interface UVRegion {
  u1: number;
  v1: number;
  u2: number;
  v2: number;
}

export class TextureAtlas {
  private regions: Record<string, UVRegion>;
  private texture: THREE.Texture | null = null;

  constructor() {
    this.regions = atlasRegions as Record<string, UVRegion>;
  }

  getUV(name: string): UVRegion | undefined {
    return this.regions[name];
  }

  /** Load the atlas texture. Call once at startup. */
  async loadTexture(): Promise<THREE.Texture> {
    if (this.texture) return this.texture;
    const loader = new THREE.TextureLoader();
    this.texture = await loader.loadAsync('/textures/atlas.png');
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestMipmapLinearFilter;
    this.texture.colorSpace = THREE.SRGBColorSpace;
    return this.texture;
  }

  /** Get the loaded texture (must call loadTexture first). */
  getTexture(): THREE.Texture {
    if (!this.texture) throw new Error('Atlas texture not loaded. Call loadTexture() first.');
    return this.texture;
  }

  /** Create a material using a specific atlas region. */
  getMaterial(regionName: string, opts?: Partial<THREE.MeshStandardMaterialParameters>): THREE.MeshStandardMaterial {
    const region = this.regions[regionName];
    if (!region) throw new Error(`Unknown atlas region: ${regionName}`);

    const tex = this.getTexture().clone();
    tex.repeat.set(region.u2 - region.u1, region.v2 - region.v1);
    tex.offset.set(region.u1, region.v1);

    return new THREE.MeshStandardMaterial({
      map: tex,
      flatShading: true,
      ...opts,
    });
  }
}
