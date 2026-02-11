// gallery/static/gallery/js/viewer.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function loadModel(containerId, modelUrl) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error("Контейнер не найден:", containerId);
        return;
    }

    // --- СЦЕНА ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);

    // --- КАМЕРА ---
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 3;

    // --- РЕНДЕРЕР ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // --- СВЕТ ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // --- ПЕРЕМЕННАЯ ДЛЯ МОДЕЛИ ---
    let loadedModel = null;

    // --- ЗАГРУЗКА МОДЕЛИ ---
    const loader = new GLTFLoader();
    
    loader.load(
        modelUrl,
        (gltf) => {
            const model = gltf.scene;
            loadedModel = model; // Сохраняем ссылку для анимации
            
            // Центрирование и подгон камеры
            fitCameraToObject(camera, model, 1.5);
            
            scene.add(model);
            console.log("✓ Модель загружена в", containerId);
        },
        undefined,
        (error) => {
            console.error('❌ Ошибка загрузки:', error);
            container.innerHTML = '❌ Ошибка загрузки';
        }
    );

    // --- АНИМАЦИЯ С ВРАЩЕНИЕМ ---
    function animate() {
        requestAnimationFrame(animate);
        
        // Если модель загрузилась - вращаем её
        if (loadedModel) {
            loadedModel.rotation.y += 0.005; // Медленное вращение
        }
        
        renderer.render(scene, camera);
    }
    animate();

    // --- RESIZE ---
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

// --- ФУНКЦИЯ ЦЕНТРИРОВАНИЯ КАМЕРЫ ---
function fitCameraToObject(camera, object, offset = 1.25) {
    // 1. Вычисляем Bounding Box
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(object);

    // 2. Находим центр и размер
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());

    // 3. Самая длинная сторона модели
    const maxDim = Math.max(size.x, size.y, size.z);

    // 4. Смещаем модель в центр
    object.position.x = -center.x;
    object.position.y = -center.y;
    object.position.z = -center.z;

    // 5. Отодвигаем камеру
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= offset;

    // Устанавливаем камеру
    camera.position.set(0, maxDim * 0.5, cameraZ);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
}