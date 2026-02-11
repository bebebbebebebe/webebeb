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
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // --- ДОБАВЛЯЕМ УПРАВЛЕНИЕ ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.1;
    controls.maxDistance = 50;

    // --- СВЕТ ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    
    //const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    //dirLight.position.set(5, 10, 7);
    //scene.add(dirLight);

    // --- НОВЫЙ PRO СВЕТ ---
    // PMREMGenerator генерирует карту окружения из сцены
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    // Создаем нейтральную "комнату"
    const roomEnvironment = new RoomEnvironment();
    // Говорим сцене: "Используй эту комнату как источник света и отражений"
    scene.environment = pmremGenerator.fromScene(roomEnvironment).texture;
    // Опционально: Можно сделать фон прозрачным или цветным
    // scene.background = new THREE.Color(0xeeeeee);
    // Если хотите прозрачность, уберите scene.background и добавьте alpha: true в рендерер


    // --- ПЕРЕМЕННАЯ ДЛЯ МОДЕЛИ ---
    let loadedModel = null;

    // --- ЗАГРУЗКА МОДЕЛИ ---
    const loader = new GLTFLoader();
    
    loader.load(
        modelUrl,
        (gltf) => {
            const model = gltf.scene;
            loadedModel = model;
            
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

    // --- АНИМАЦИЯ ---
    function animate() {
        requestAnimationFrame(animate);
        
        controls.update(); // Обновляем контроллер
        
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