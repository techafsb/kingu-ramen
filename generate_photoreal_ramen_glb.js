/**
 * Kingu Ramen - Ultra-Photorealistic 3D Ramen Bowl GLB Generator v4
 * 
 * Major Fixes for Maximum Photorealism:
 * 1. Concentric Polar Mesh: Replaces the jagged saw-tooth Cartesian grid with a 100% mathematically
 *    smooth 96-slice polar ring topology. Zero serrated edges!
 * 2. Ultra-Detailed 1024x1024 Studio Food Texture: Clean, crisp, high-resolution texture with true
 *    color saturation, caramelized braised beef, golden runny onsen eggs, and deep red mala broth.
 * 3. Accurate 3D Depth Relief: Height elevation mapped to the 3D features of the food.
 * 4. Realistic Donburi Bowl: 96-segment smooth lathe geometry with authentic ceramic rim thickness.
 * 5. Volumetric 3D Toppings: 32 individual 3D green onion ribbons crowning the bowl.
 */

const fs = require('fs');
const path = require('path');

function pad4(buf, padByte = 0) {
    const rem = buf.length % 4;
    if (rem === 0) return buf;
    return Buffer.concat([buf, Buffer.alloc(4 - rem, padByte)]);
}

function buildPhotorealRamenGLB() {
    console.log('Generating ultra-photorealistic concentric polar ramen GLB...');

    const foodImgBuf = fs.readFileSync('assets/images/kingu_food_photoreal_1024.png');
    const bowlBottomImgBuf = fs.readFileSync('assets/images/user_ramen_bowl_bottom_512.png');

    // -------------------------------------------------------------
    // 1. Ceramic Bowl Geometry (96-segment lathe Japanese Donburi)
    // -------------------------------------------------------------
    // Revolving cross-section profile: (r, y, v)
    // Rim crest at y = 0.52, waterline at y = 0.44 (depth = 0.08 below rim)
    const bowlProfile = [
        { r: 0.00, y: 0.025, v: 0.0 },    // center bottom recess
        { r: 0.35, y: 0.025, v: 0.05 },
        { r: 0.38, y: 0.00, v: 0.10 },   // foot bottom
        { r: 0.42, y: 0.00, v: 0.12 },   // foot outer
        { r: 0.43, y: 0.04, v: 0.15 },   // foot base junction
        { r: 0.58, y: 0.14, v: 0.32 },   // gentle lower flare
        { r: 0.74, y: 0.27, v: 0.55 },   // mid body flare
        { r: 0.88, y: 0.39, v: 0.78 },   // upper flare
        { r: 0.98, y: 0.49, v: 0.94 },   // outer rim
        { r: 1.00, y: 0.51, v: 0.98 },   // outer rim crest
        { r: 0.98, y: 0.52, v: 1.00 },   // top rim edge
        { r: 0.95, y: 0.50, v: 0.96 },   // inner rim
        { r: 0.925, y: 0.455, v: 0.88 }, // inner wall just above waterline
        { r: 0.915, y: 0.440, v: 0.80 }, // inner wall waterline (meets food mesh perfectly!)
        { r: 0.86, y: 0.38, v: 0.68 },   // inner wall lower
        { r: 0.70, y: 0.25, v: 0.48 },   // inner bowl transition
        { r: 0.42, y: 0.12, v: 0.22 },   // inner bowl floor
        { r: 0.00, y: 0.08, v: 0.0 }     // center inner bottom
    ];

    const bowlSegs = 96; // 96 segments for silky smooth porcelain
    const bowlVerts = [];
    const bowlNorms = [];
    const bowlUvs = [];
    const bowlIndices = [];

    // Generate bowl vertices
    for (let i = 0; i < bowlProfile.length; i++) {
        const p = bowlProfile[i];
        for (let j = 0; j <= bowlSegs; j++) {
            const theta = (j / bowlSegs) * Math.PI * 2;
            const sinT = Math.sin(theta);
            const cosT = Math.cos(theta);

            const x = p.r * cosT;
            const z = p.r * sinT;
            const y = p.y;

            bowlVerts.push(x, y, z);
            const u = j / bowlSegs;
            bowlUvs.push(u, p.v);
        }
    }

    // Generate indices for bowl
    const ringSize = bowlSegs + 1;
    for (let i = 0; i < bowlProfile.length - 1; i++) {
        for (let j = 0; j < bowlSegs; j++) {
            const i0 = i * ringSize + j;
            const i1 = i0 + 1;
            const i2 = (i + 1) * ringSize + j;
            const i3 = i2 + 1;

            bowlIndices.push(i0, i2, i1);
            bowlIndices.push(i1, i2, i3);
        }
    }

    // Compute normals for bowl
    const bowlNormVecs = new Array(bowlVerts.length / 3).fill(null).map(() => [0, 0, 0]);
    for (let i = 0; i < bowlIndices.length; i += 3) {
        const a = bowlIndices[i];
        const b = bowlIndices[i + 1];
        const c = bowlIndices[i + 2];

        const ax = bowlVerts[a * 3], ay = bowlVerts[a * 3 + 1], az = bowlVerts[a * 3 + 2];
        const bx = bowlVerts[b * 3], by = bowlVerts[b * 3 + 1], bz = bowlVerts[b * 3 + 2];
        const cx = bowlVerts[c * 3], cy = bowlVerts[c * 3 + 1], cz = bowlVerts[c * 3 + 2];

        const abx = bx - ax, aby = by - ay, abz = bz - az;
        const acx = cx - ax, acy = cy - ay, acz = cz - az;

        const nx = aby * acz - abz * acy;
        const ny = abz * acx - abx * acz;
        const nz = abx * acy - aby * acx;

        bowlNormVecs[a][0] += nx; bowlNormVecs[a][1] += ny; bowlNormVecs[a][2] += nz;
        bowlNormVecs[b][0] += nx; bowlNormVecs[b][1] += ny; bowlNormVecs[b][2] += nz;
        bowlNormVecs[c][0] += nx; bowlNormVecs[c][1] += ny; bowlNormVecs[c][2] += nz;
    }

    for (let i = 0; i < bowlNormVecs.length; i++) {
        const v = bowlNormVecs[i];
        const len = Math.hypot(v[0], v[1], v[2]) || 1;
        bowlNorms.push(v[0] / len, v[1] / len, v[2] / len);
    }

    // -------------------------------------------------------------
    // 2. Concentric Polar 3D Food Surface (Zero Saw Teeth!)
    // -------------------------------------------------------------
    // Exact match with bowl waterline: foodRadius = 0.915, baseY = 0.440
    const foodRadius = 0.915;
    const foodBaseY = 0.440;
    const numRings = 48;
    const numSlices = 96;

    const foodVerts = [];
    const foodNorms = [];
    const foodUvs = [];
    const foodIndices = [];

    // Height elevation function matching the ultra-detailed 1024x1024 image
    function getFoodHeight(nx, nz) {
        let h = 0;

        // 1. Center Scallion Mound (-0.06, -0.02)
        const dScal = Math.hypot(nx - (-0.06), nz - (-0.02));
        if (dScal < 0.28) {
            const f = Math.max(0, 1 - (dScal / 0.28) ** 2);
            h += 0.080 * (f ** 2);
            h += Math.sin(nx * 48) * Math.cos(nz * 48) * 0.008 * f;
        }

        // 2. Braised Beef Pile (right side: nx > 0.0, nz < 0.40)
        const dBeef = Math.hypot(nx - 0.28, nz - (-0.18));
        if (dBeef < 0.62) {
            const f = Math.max(0, 1 - (dBeef / 0.62) ** 1.8);
            h += 0.072 * (f ** 1.6);
            // Meat grain ripples & crispy garlic chips
            h += (Math.sin(nx * 32 + nz * 28) * 0.010 + Math.cos(nx * 20 - nz * 22) * 0.006) * f;
        }

        // 3. Top Halved Onsen Egg (-0.48, -0.06)
        const dEgg1 = Math.hypot((nx - (-0.48)) / 0.22, (nz - (-0.06)) / 0.22);
        if (dEgg1 < 1.0) {
            const f = Math.max(0, 1 - dEgg1 ** 2);
            h += 0.055 * (f ** 1.4);
            // Raised yolk bulge
            const dYolk1 = Math.hypot((nx - (-0.46)) / 0.12, (nz - (-0.05)) / 0.12);
            if (dYolk1 < 1.0) {
                h += 0.010 * Math.max(0, 1 - dYolk1 ** 2);
            }
        }

        // 4. Bottom Halved Onsen Egg (-0.35, 0.28)
        const dEgg2 = Math.hypot((nx - (-0.35)) / 0.22, (nz - 0.28) / 0.22);
        if (dEgg2 < 1.0) {
            const f = Math.max(0, 1 - dEgg2 ** 2);
            h += 0.055 * (f ** 1.4);
            const dYolk2 = Math.hypot((nx - (-0.33)) / 0.12, (nz - 0.29) / 0.12);
            if (dYolk2 < 1.0) {
                h += 0.010 * Math.max(0, 1 - dYolk2 ** 2);
            }
        }

        // 5. Bok Choy Greens (0.00, 0.52)
        const dGreens = Math.hypot((nx - 0.00) / 0.28, (nz - 0.52) / 0.22);
        if (dGreens < 1.0) {
            const f = Math.max(0, 1 - dGreens ** 2);
            h += 0.040 * f + Math.sin(nx * 36) * 0.008 * f;
        }

        // 6. Narutomaki Fishcake (-0.55, -0.32)
        const dNaruto = Math.hypot(nx - (-0.55), nz - (-0.32));
        if (dNaruto < 0.18) {
            const f = Math.max(0, 1 - (dNaruto / 0.18) ** 4);
            h += 0.038 * f;
        }

        // 7. Springy Ramen Noodles in middle
        const dMid = Math.hypot(nx, nz);
        if (dMid < 0.65) {
            h += 0.016 + Math.sin(nx * 42 + nz * 42) * 0.004;
        }

        // 8. Meniscus curving upward at the outer boundary to seal flush with bowl
        if (dMid > 0.86) {
            const f = (dMid - 0.86) / 0.14;
            h += 0.024 * (f ** 2);
        }

        return h;
    }

    // Generate concentric rings
    // Center vertex (ring 0)
    foodVerts.push(0, foodBaseY + getFoodHeight(0, 0), 0);
    foodUvs.push(0.5, 0.5);

    for (let r = 1; r <= numRings; r++) {
        const rFrac = r / numRings;
        const currentR = rFrac * foodRadius;

        for (let s = 0; s < numSlices; s++) {
            const theta = (s / numSlices) * Math.PI * 2;
            const nx = rFrac * Math.cos(theta);
            const nz = rFrac * Math.sin(theta);

            const x = currentR * Math.cos(theta);
            const z = currentR * Math.sin(theta);
            const h = getFoodHeight(nx, nz);
            const y = foodBaseY + h;

            foodVerts.push(x, y, z);

            // UV coordinates: map [-1, 1] to [0, 1]
            const u = nx * 0.5 + 0.5;
            const v = nz * 0.5 + 0.5;
            foodUvs.push(u, v);
        }
    }

    // Generate faces: Center fan for ring 1 (CCW winding -> normal points +Y UP)
    for (let s = 0; s < numSlices; s++) {
        const nextS = (s + 1) % numSlices;
        foodIndices.push(0, 1 + nextS, 1 + s);
    }

    // Quad strips for subsequent rings (CCW winding -> normal points +Y UP)
    for (let r = 1; r < numRings; r++) {
        const r0Start = 1 + (r - 1) * numSlices;
        const r1Start = 1 + r * numSlices;

        for (let s = 0; s < numSlices; s++) {
            const nextS = (s + 1) % numSlices;

            const i0 = r0Start + s;
            const i1 = r0Start + nextS;
            const i2 = r1Start + s;
            const i3 = r1Start + nextS;

            foodIndices.push(i0, i1, i2);
            foodIndices.push(i1, i3, i2);
        }
    }

    // Compute normals for polar food mesh
    const foodNormVecs = new Array(foodVerts.length / 3).fill(null).map(() => [0, 0, 0]);
    for (let i = 0; i < foodIndices.length; i += 3) {
        const a = foodIndices[i];
        const b = foodIndices[i + 1];
        const c = foodIndices[i + 2];

        const ax = foodVerts[a * 3], ay = foodVerts[a * 3 + 1], az = foodVerts[a * 3 + 2];
        const bx = foodVerts[b * 3], by = foodVerts[b * 3 + 1], bz = foodVerts[b * 3 + 2];
        const cx = foodVerts[c * 3], cy = foodVerts[c * 3 + 1], cz = foodVerts[c * 3 + 2];

        const abx = bx - ax, aby = by - ay, abz = bz - az;
        const acx = cx - ax, acy = cy - ay, acz = cz - az;

        const nx = aby * acz - abz * acy;
        const ny = abz * acx - abx * acz;
        const nz = abx * acy - aby * acx;

        foodNormVecs[a][0] += nx; foodNormVecs[a][1] += ny; foodNormVecs[a][2] += nz;
        foodNormVecs[b][0] += nx; foodNormVecs[b][1] += ny; foodNormVecs[b][2] += nz;
        foodNormVecs[c][0] += nx; foodNormVecs[c][1] += ny; foodNormVecs[c][2] += nz;
    }

    for (let i = 0; i < foodNormVecs.length; i++) {
        const v = foodNormVecs[i];
        const len = Math.hypot(v[0], v[1], v[2]) || 1;
        foodNorms.push(v[0] / len, v[1] / len, v[2] / len);
    }

    // -------------------------------------------------------------
    // 3. Volumetric 3D Topping Enhancements (32 Scallion Ribbons)
    // -------------------------------------------------------------
    const scallionVerts = [];
    const scallionNorms = [];
    const scallionIndices = [];

    const numScallions = 32;
    for (let s = 0; s < numScallions; s++) {
        const baseAngle = (s / numScallions) * Math.PI * 2 + (s * 1.37);
        const rOff = 0.02 + Math.random() * 0.12;
        const startX = -0.06 + Math.cos(baseAngle) * rOff;
        const startZ = -0.02 + Math.sin(baseAngle) * rOff;
        const startY = 0.51 + Math.random() * 0.02;

        const stripLen = 0.048 + Math.random() * 0.038;
        const curveDir = Math.random() * Math.PI * 2;
        const width = 0.007;

        const segs = 4;
        const startV = scallionVerts.length / 3;

        for (let k = 0; k <= segs; k++) {
            const t = k / segs;
            const px = startX + Math.cos(curveDir) * t * stripLen + Math.sin(t * Math.PI) * 0.008;
            const pz = startZ + Math.sin(curveDir) * t * stripLen + Math.cos(t * Math.PI) * 0.008;
            const py = startY + Math.sin(t * Math.PI) * 0.014 - t * 0.005;

            scallionVerts.push(px - width, py, pz);
            scallionVerts.push(px + width, py, pz);
            scallionNorms.push(0, 1, 0);
            scallionNorms.push(0, 1, 0);
        }

        for (let k = 0; k < segs; k++) {
            const v0 = startV + k * 2;
            const v1 = v0 + 1;
            const v2 = v0 + 2;
            const v3 = v0 + 3;

            scallionIndices.push(v0, v2, v1);
            scallionIndices.push(v1, v2, v3);
            scallionIndices.push(v0, v1, v2);
            scallionIndices.push(v1, v3, v2);
        }
    }

    // -------------------------------------------------------------
    // 4. Binary Buffers Assembly
    // -------------------------------------------------------------
    const bowlVertsBuf = pad4(Buffer.from(new Float32Array(bowlVerts).buffer));
    const bowlNormsBuf = pad4(Buffer.from(new Float32Array(bowlNorms).buffer));
    const bowlUvsBuf = pad4(Buffer.from(new Float32Array(bowlUvs).buffer));
    const bowlIdxBuf = pad4(Buffer.from(new Uint16Array(bowlIndices).buffer));

    const foodVertsBuf = pad4(Buffer.from(new Float32Array(foodVerts).buffer));
    const foodNormsBuf = pad4(Buffer.from(new Float32Array(foodNorms).buffer));
    const foodUvsBuf = pad4(Buffer.from(new Float32Array(foodUvs).buffer));
    const foodIdxBuf = pad4(Buffer.from(new Uint16Array(foodIndices).buffer));

    const scalVertsBuf = pad4(Buffer.from(new Float32Array(scallionVerts).buffer));
    const scalNormsBuf = pad4(Buffer.from(new Float32Array(scallionNorms).buffer));
    const scalIdxBuf = pad4(Buffer.from(new Uint16Array(scallionIndices).buffer));

    const foodImgPad = pad4(foodImgBuf);
    const bowlImgPad = pad4(bowlBottomImgBuf);

    const buffersList = [
        bowlVertsBuf, bowlNormsBuf, bowlUvsBuf, bowlIdxBuf,     // 0, 1, 2, 3
        foodVertsBuf, foodNormsBuf, foodUvsBuf, foodIdxBuf,     // 4, 5, 6, 7
        scalVertsBuf, scalNormsBuf, scalIdxBuf,                 // 8, 9, 10
        foodImgPad, bowlImgPad                                  // 11, 12
    ];

    let currentOffset = 0;
    const bufferViews = [];
    for (let i = 0; i < buffersList.length; i++) {
        const b = buffersList[i];
        bufferViews.push({
            buffer: 0,
            byteOffset: currentOffset,
            byteLength: b.length,
            target: i === 3 || i === 7 || i === 10 ? 34963 : (i <= 10 ? 34962 : undefined)
        });
        currentOffset += b.length;
    }

    const fullBinBuffer = Buffer.concat(buffersList);

    function getMinMax3(arr) {
        let min = [Infinity, Infinity, Infinity];
        let max = [-Infinity, -Infinity, -Infinity];
        for (let i = 0; i < arr.length; i += 3) {
            min[0] = Math.min(min[0], arr[i]);
            min[1] = Math.min(min[1], arr[i + 1]);
            min[2] = Math.min(min[2], arr[i + 2]);
            max[0] = Math.max(max[0], arr[i]);
            max[1] = Math.max(max[1], arr[i + 1]);
            max[2] = Math.max(max[2], arr[i + 2]);
        }
        return { min, max };
    }

    function getMinMax2(arr) {
        let min = [Infinity, Infinity];
        let max = [-Infinity, -Infinity];
        for (let i = 0; i < arr.length; i += 2) {
            min[0] = Math.min(min[0], arr[i]);
            min[1] = Math.min(min[1], arr[i + 1]);
            max[0] = Math.max(max[0], arr[i]);
            max[1] = Math.max(max[1], arr[i + 1]);
        }
        return { min, max };
    }

    const bBox = getMinMax3(bowlVerts);
    const bUvBox = getMinMax2(bowlUvs);
    const fBox = getMinMax3(foodVerts);
    const fUvBox = getMinMax2(foodUvs);
    const sBox = getMinMax3(scallionVerts);

    const accessors = [
        // 0: bowl pos
        { bufferView: 0, byteOffset: 0, componentType: 5126, count: bowlVerts.length / 3, type: 'VEC3', min: bBox.min, max: bBox.max },
        // 1: bowl norm
        { bufferView: 1, byteOffset: 0, componentType: 5126, count: bowlNorms.length / 3, type: 'VEC3' },
        // 2: bowl uv
        { bufferView: 2, byteOffset: 0, componentType: 5126, count: bowlUvs.length / 2, type: 'VEC2', min: bUvBox.min, max: bUvBox.max },
        // 3: bowl indices
        { bufferView: 3, byteOffset: 0, componentType: 5123, count: bowlIndices.length, type: 'SCALAR' },

        // 4: food pos
        { bufferView: 4, byteOffset: 0, componentType: 5126, count: foodVerts.length / 3, type: 'VEC3', min: fBox.min, max: fBox.max },
        // 5: food norm
        { bufferView: 5, byteOffset: 0, componentType: 5126, count: foodNorms.length / 3, type: 'VEC3' },
        // 6: food uv
        { bufferView: 6, byteOffset: 0, componentType: 5126, count: foodUvs.length / 2, type: 'VEC2', min: fUvBox.min, max: fUvBox.max },
        // 7: food indices
        { bufferView: 7, byteOffset: 0, componentType: 5123, count: foodIndices.length, type: 'SCALAR' },

        // 8: scallion pos
        { bufferView: 8, byteOffset: 0, componentType: 5126, count: scallionVerts.length / 3, type: 'VEC3', min: sBox.min, max: sBox.max },
        // 9: scallion norm
        { bufferView: 9, byteOffset: 0, componentType: 5126, count: scallionNorms.length / 3, type: 'VEC3' },
        // 10: scallion indices
        { bufferView: 10, byteOffset: 0, componentType: 5123, count: scallionIndices.length, type: 'SCALAR' }
    ];

    const gltf = {
        asset: { version: '2.0', generator: 'Kingu_Ramen_Photoreal_Polar_v4' },
        buffers: [{ byteLength: fullBinBuffer.length }],
        bufferViews: bufferViews,
        accessors: accessors,
        samplers: [{
            magFilter: 9729, // LINEAR
            minFilter: 9987, // LINEAR_MIPMAP_LINEAR
            wrapS: 10497,    // REPEAT
            wrapT: 10497
        }],
        images: [
            { bufferView: 11, mimeType: 'image/png', name: 'Food_Texture' },
            { bufferView: 12, mimeType: 'image/png', name: 'Bowl_Texture' }
        ],
        textures: [
            { sampler: 0, source: 0, name: 'Tex_Food' },
            { sampler: 0, source: 1, name: 'Tex_Bowl' }
        ],
        materials: [
            // Material 0: Bowl Warm Porcelain Ceramic
            {
                name: 'Ceramic_Porcelain_Bowl',
                pbrMetallicRoughness: {
                    baseColorFactor: [0.95, 0.93, 0.90, 1.0],
                    roughnessFactor: 0.22,
                    metallicFactor: 0.01,
                    baseColorTexture: { index: 1 }
                },
                doubleSided: true
            },
            // Material 1: Photoreal 3D Ramen Food & Broth
            {
                name: 'Photoreal_Ramen_Food',
                pbrMetallicRoughness: {
                    baseColorTexture: { index: 0 },
                    roughnessFactor: 0.32,
                    metallicFactor: 0.01
                },
                doubleSided: true
            },
            // Material 2: Fresh Green Scallion Shreds
            {
                name: 'Fresh_Scallion_Greens',
                pbrMetallicRoughness: {
                    baseColorFactor: [0.18, 0.52, 0.10, 1.0],
                    roughnessFactor: 0.44,
                    metallicFactor: 0.0
                },
                doubleSided: true
            }
        ],
        meshes: [
            // Mesh 0: Ceramic Bowl
            {
                name: 'Ceramic_Donburi_Bowl',
                primitives: [{
                    attributes: {
                        POSITION: 0,
                        NORMAL: 1,
                        TEXCOORD_0: 2
                    },
                    indices: 3,
                    material: 0
                }]
            },
            // Mesh 1: Photoreal 3D Displaced Ramen Food
            {
                name: 'Ramen_Food_3D_Displaced',
                primitives: [{
                    attributes: {
                        POSITION: 4,
                        NORMAL: 5,
                        TEXCOORD_0: 6
                    },
                    indices: 7,
                    material: 1
                }]
            },
            // Mesh 2: 3D Scallions
            {
                name: 'Scallion_Cluster_3D',
                primitives: [{
                    attributes: {
                        POSITION: 8,
                        NORMAL: 9
                    },
                    indices: 10,
                    material: 2
                }]
            }
        ],
        nodes: [
            { name: 'Ceramic_Bowl_Node', mesh: 0 },
            { name: 'Ramen_Food_Node', mesh: 1 },
            { name: 'Scallions_3D_Node', mesh: 2 },
            {
                name: 'Kingu_Spicy_Beef_Ramen_Root',
                children: [0, 1, 2]
            }
        ],
        scenes: [{
            name: 'Kingu_Ramen_Photoreal_Scene',
            nodes: [3]
        }],
        scene: 0
    };

    let jsonStr = JSON.stringify(gltf);
    while (Buffer.byteLength(jsonStr, 'utf8') % 4 !== 0) jsonStr += ' ';
    const jsonBuf = Buffer.from(jsonStr, 'utf8');

    const totalGLBLength = 12 + 8 + jsonBuf.length + 8 + fullBinBuffer.length;

    const header = Buffer.alloc(12);
    header.writeUInt32LE(0x46546C67, 0);
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(totalGLBLength, 8);

    const chunk0Header = Buffer.alloc(8);
    chunk0Header.writeUInt32LE(jsonBuf.length, 0);
    chunk0Header.writeUInt32LE(0x4E4F534A, 4);

    const chunk1Header = Buffer.alloc(8);
    chunk1Header.writeUInt32LE(fullBinBuffer.length, 0);
    chunk1Header.writeUInt32LE(0x004E4942, 4);

    const glbBuffer = Buffer.concat([
        header,
        chunk0Header,
        jsonBuf,
        chunk1Header,
        fullBinBuffer
    ]);

    const outPath = path.join(__dirname, 'assets', 'models', 'kingu_spicy_beef_ramen.glb');
    fs.writeFileSync(outPath, glbBuffer);
    console.log(`Successfully generated ultra-photorealistic polar donburi ramen GLB: ${outPath} (${glbBuffer.length} bytes)`);
}

buildPhotorealRamenGLB();
