/**
 * Xalif - Advanced Desktop Pet
 * Optimized for smoothness, performance, and cross-browser compatibility.
 */
(function() {
    const APP_ID = "Xalif";
    const SPRITE_URL = "https://cdn.jsdelivr.net/gh/friendfamily1590-bot/Xylon-404@main/xalif.png";
    const FRAME_SIZE = 128;

    // Animation Data Mapping
    const ANIMATIONS = {
        idle: [{ x: 128, y: 0, end: true }],
        blink: [{ x: 128, y: 0 }, { x: 128, y: 0, end: true }],
        walk: [
            { x: 0, y: 384, move: 4 }, { x: 512, y: 512, move: 4 }, 
            { x: 384, y: 256, move: 4 }, { x: 768, y: 256, move: 4 },
            { x: 384, y: 512, move: 4 }, { x: 128, y: 0, end: true }
        ],
        run: [
            { x: 896, y: 0, move: 8 }, { x: 896, y: 256, move: 8 },
            { x: 896, y: 384, move: 8 }, { x: 128, y: 0, end: true }
        ],
        creep: [
            { x: 256, y: 384, move: 1 }, { x: 128, y: 384, move: 1 },
            { x: 256, y: 384, move: 1 }, { x: 128, y: 0, end: true }
        ],
        drag: [{ x: 0, y: 640 }],
        fall: [{ x: 768, y: 384 }]
    };

    class Xalif {
        constructor() {
            this.x = window.innerWidth / 2;
            this.y = window.innerHeight;
            this.velocityX = 0;
            this.velocityY = 0;
            this.scaleX = 1;
            
            this.state = "idle";
            this.frameIndex = 0;
            this.isDragging = false;
            this.isFalling = false;
            
            this.lastUpdate = performance.now();
            this.animTimer = 0;
            this.aiTimer = 0;

            this.initUI();
            this.bindEvents();
            this.loop();
        }

        initUI() {
            // Container for the pet
            this.workArea = document.getElementById(APP_ID + "WorkArea");
            if (!this.workArea) {
                this.workArea = document.createElement("div");
                this.workArea.id = APP_ID + "WorkArea";
                Object.assign(this.workArea.style, {
                    position: "fixed",
                    top: "0",
                    left: "0",
                    width: "100vw",
                    height: "100vh",
                    pointerEvents: "none",
                    zIndex: "999999",
                    background: "transparent"
                });
                document.body.appendChild(this.workArea);
            }

            // The Pet Element
            this.el = document.createElement("div");
            Object.assign(this.el.style, {
                position: "absolute",
                width: `${FRAME_SIZE}px`,
                height: `${FRAME_SIZE}px`,
                backgroundImage: `url("${SPRITE_URL}")`,
                backgroundRepeat: "no-repeat",
                pointerEvents: "auto",
                cursor: "grab",
                zIndex: "1000000",
                transformOrigin: "bottom center",
                transition: "transform 0.1s ease-out", // Smooth movement transition
                willChange: "transform, background-position"
            });

            this.workArea.appendChild(this.el);
            this.updatePosition();
        }

        bindEvents() {
            this.el.addEventListener("pointerdown", (e) => {
                this.isDragging = true;
                this.isFalling = false;
                this.state = "drag";
                this.el.style.cursor = "grabbing";
                this.el.setPointerCapture(e.pointerId);
                
                // Track offset for natural dragging
                const rect = this.el.getBoundingClientRect();
                this.dragOffsetX = e.clientX - (rect.left + rect.width / 2);
                this.dragOffsetY = e.clientY - rect.bottom;
            });

            window.addEventListener("pointermove", (e) => {
                if (!this.isDragging) return;
                this.x = e.clientX - this.dragOffsetX;
                this.y = e.clientY - this.dragOffsetY;
                
                // Calculate velocity based on movement for "throwing" effect
                this.velocityX = (e.movementX || 0) * 0.5;
                this.scaleX = this.velocityX >= 0 ? 1 : -1;
            });

            window.addEventListener("pointerup", (e) => {
                if (!this.isDragging) return;
                this.isDragging = false;
                this.isFalling = true;
                this.el.style.cursor = "grab";
                this.el.releasePointerCapture(e.pointerId);
            });
        }

        updatePosition() {
            // Apply coordinates. We subtract height so 'y' refers to the feet position.
            this.el.style.transform = `translate(${this.x - FRAME_SIZE / 2}px, ${this.y - FRAME_SIZE}px) scaleX(${this.scaleX})`;
        }

        setFrame(x, y) {
            this.el.style.backgroundPosition = `-${x}px -${y}px`;
        }

        handleAI() {
            if (this.isDragging || this.isFalling) return;

            this.aiTimer++;
            if (this.aiTimer > 200) { // Every ~3 seconds
                this.aiTimer = 0;
                const choices = ["walk", "run", "creep", "idle", "blink"];
                this.state = choices[Math.floor(Math.random() * choices.length)];
                this.frameIndex = 0;
            }
        }

        updatePhysics() {
            if (this.isDragging) return;

            const ground = window.innerHeight;

            // Gravity
            if (this.y < ground) {
                this.isFalling = true;
                this.state = "fall";
                this.velocityY += 0.8; // Gravity constant
            } else {
                if (this.isFalling) {
                    this.state = "idle";
                    this.frameIndex = 0;
                }
                this.isFalling = false;
                this.y = ground;
                this.velocityY = 0;
                this.velocityX *= 0.9; // Friction
            }

            // Screen Bounds
            if (this.x < 50) { this.x = 50; this.velocityX *= -0.5; this.scaleX = 1; }
            if (this.x > window.innerWidth - 50) { this.x = window.innerWidth - 50; this.velocityX *= -0.5; this.scaleX = -1; }

            this.x += this.velocityX;
            this.y += this.velocityY;
        }

        loop() {
            const now = performance.now();
            const delta = now - this.lastUpdate;
            this.lastUpdate = now;

            this.updatePhysics();
            this.handleAI();

            // Animation Controller
            this.animTimer += delta;
            if (this.animTimer > 120) { // ~8 FPS animation
                this.animTimer = 0;
                const anim = ANIMATIONS[this.state] || ANIMATIONS.idle;
                const frame = anim[this.frameIndex];

                if (frame) {
                    this.setFrame(frame.x, frame.y);
                    if (frame.move) {
                        this.x += frame.move * this.scaleX;
                    }
                    
                    this.frameIndex++;
                    if (this.frameIndex >= anim.length || frame.end) {
                        this.frameIndex = 0;
                    }
                }
            }

            this.updatePosition();
            requestAnimationFrame(() => this.loop());
        }
    }

    // Initialize on load
    if (document.readyState === "complete") {
        new Xalif();
    } else {
        window.addEventListener("load", () => new Xalif());
    }
})();
