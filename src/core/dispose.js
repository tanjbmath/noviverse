// Textures can be shared within a scene. Dispose each GPU resource just once.
export function disposeScene(scene) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  scene.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    for (const material of [object.material].flat().filter(Boolean)) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      for (const uniform of Object.values(material.uniforms || {})) if (uniform.value?.isTexture) textures.add(uniform.value);
    }
  });
  geometries.forEach(x => x.dispose());
  materials.forEach(x => x.dispose());
  textures.forEach(x => x.dispose());
  scene.clear();
}
