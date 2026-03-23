// gallery/static/gallery/js/viewer.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function loadModel(containerId, modelUrl) {
    const container = document.getElementById(containerId);
    
    if (!container) {
        
        console.error("Контейнер не найден:", containerId);
        return;
    }


    // Очищаем содержимое контейнера (убирает превью-изображение)
    container.innerHTML = '';

    // Устанавливаем однотонный фон
    container.style.backgroundImage = 'none';
    container.style.backgroundColor = '#f8f9fa'; // светло-серый фон
    // --- СЦЕНА ---
    const scene = new THREE.Scene();
    scene.background = null;

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
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // Добавить эти две строки:
    renderer.domElement.style.pointerEvents = 'auto';
    renderer.domElement.style.zIndex = '9999';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // --- УПРАВЛЕНИЕ ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.1;
    controls.maxDistance = 50;

    // --- СВЕТ ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    
    // --- PRO СВЕТ (ОКРУЖЕНИЕ) ---
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnvironment = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(roomEnvironment).texture;

    // --- ПЕРЕМЕННАЯ ДЛЯ МОДЕЛИ ---
    let loadedModel = null;

    // --- СОЗДАЕМ ЛОАДЕР ---
    const loaderDiv = document.createElement('div');
    loaderDiv.className = 'loader-overlay';
    loaderDiv.innerHTML = `
        <div style="color: #666; font-size: 0.9rem;">Loading...</div>
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
    `;
    container.appendChild(loaderDiv);
    const progressFill = loaderDiv.querySelector('.progress-fill');

    // --- ЗАГРУЗКА МОДЕЛИ ---
    const loader = new GLTFLoader();
    
    loader.load(
        modelUrl,
        (gltf) => {
            const model = gltf.scene;
            loadedModel = model;
            
            fitCameraToObject(camera, model, 1.5);
            scene.add(model);
            
            // Скрываем лоадер
            loaderDiv.style.opacity = '0';
            setTimeout(() => {
                loaderDiv.remove();
            }, 300);
            
            console.log("✓ Модель загружена в", containerId);
        },
        (xhr) => {
            if (xhr.total > 0) {
                const percent = (xhr.loaded / xhr.total) * 100;
                progressFill.style.width = percent + '%';
            }
        },
        (error) => {
            console.error('❌ Ошибка загрузки:', error);
            loaderDiv.innerHTML = `<div style="color: #721c24; background: #f8d7da; padding: 10px; border-radius: 4px;">❌ Ошибка загрузки<br><small>Проверьте файл</small></div>`;
        }
    );

    // --- АНИМАЦИЯ ---
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
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
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(object);

    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);

    object.position.x = -center.x;
    object.position.y = -center.y;
    object.position.z = -center.z;

    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= offset;

    camera.position.set(0, maxDim * 0.5, cameraZ);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
}


