import Zepr = require('zepr.ts');
import { Scene } from './ktsObjects';

class MenuItem extends Zepr.RawSprite<Zepr.Rectangle> implements Zepr.Clickable {

    private offCanvas: HTMLCanvasElement;

    private completed: boolean;

    constructor(private _index: number, private _data: Scene, box: HTMLImageElement, private font: Zepr.Font) {
        super(new Zepr.Rectangle(40 + (_index % 16) * 80, 252 + Math.floor(_index / 16) * 80, 80, 80));

        let text: string = '' + (_index + 1);

        this.offCanvas = document.createElement<'canvas'>('canvas');
        this.offCanvas.width = 80;
        this.offCanvas.height = 80;
        let offCtx: CanvasRenderingContext2D = this.offCanvas.getContext('2d');
        
        offCtx.save();
        // Background
        offCtx.fillStyle = _data.color;
        offCtx.fillRect(0, 0, 80, 80);
        // Box
        offCtx.translate(40, 40);
        offCtx.rotate((Math.random() * 10 - 5) * Math.PI / 180);
        offCtx.drawImage(box, -box.width / 2, -box.height / 2);
        // Number
        offCtx.font = font.size + 'px ' + font.face;
        offCtx.fillStyle = font.color;
        let width: number = offCtx.measureText(text).width;
        offCtx.fillText(text, -width / 2, 15);

        offCtx.restore();

        this.completed = false;
    }

    setCompleted(): void {
        if (!this.completed) {
            let offCtx: CanvasRenderingContext2D = this.offCanvas.getContext('2d');
            offCtx.font = '40px ' + this.font.face;
            offCtx.fillStyle = this.font.color;
            offCtx.fillText(String.fromCharCode(10004), this.offCanvas.width - 35, this.offCanvas.height - 5);

            this.completed = true;
        }
    }

    render(context: CanvasRenderingContext2D): void {
        context.drawImage(this.offCanvas, this.shape.x - 40, this.shape.y - 40);
    }

    onClick(engine: Zepr.Engine, screen: Zepr.GameScreen, point: Zepr.Point): void {
        engine.setData('scene', this._data);
        engine.setData('level', this._index);
        engine.start('game');
    }
}



class FullscreenSprite extends Zepr.RawSprite<Zepr.Circle> implements Zepr.Clickable {

    constructor(private fullscreen: HTMLImageElement, private window: HTMLImageElement) {
        super(new Zepr.Circle(770, 30, 16), 1);
    }

    render(context: CanvasRenderingContext2D): void {
        if (Zepr.Fullscreen.isActive()) {
            context.drawImage(this.window, this.shape.x - 20, this.shape.y - 20);
        } else {
            context.drawImage(this.fullscreen, this.shape.x - 20, this.shape.y - 20);
        }
    }

    onClick(engine: Zepr.Engine, screen: Zepr.GameScreen, point: Zepr.Point): void {
        Zepr.Fullscreen.toggle();
    }
}


export class KtsMenuScreen implements Zepr.GameScreen {
    
    images: Array<string> = [
        'images/logo_small.png', 'images/menu_box.png', 'images/mode_fullscreen.png', 'images/mode_window.png'
    ];

    private currentIndex: number;
    private levels: Array<MenuItem>;
    private uploadInProgress: boolean;

    private font: Zepr.Font;

    private completed: Array<boolean>;

    constructor() {
        this.currentIndex = 0;
        this.levels = new Array<MenuItem>();

        this.uploadInProgress = false;

        // Load completed levels
        let storageValue = localStorage.getItem('completed');
        if (storageValue) {
            this.completed = JSON.parse(storageValue);
        } else {
            this.completed = new Array<boolean>();
            localStorage.setItem('completed', JSON.stringify(this.completed));
        }
    }

    init(engine: Zepr.Engine): void {

        engine.setBackgroundColor('#ffffff');

        // Check if player has completed a level
        if (engine.getData('completed')) {
            let completedLevel: number = engine.getData('level');
            // Update list of completed levels
            this.completed[completedLevel] = true;
            localStorage.setItem('completed', JSON.stringify(this.completed));
            // Update state
            this.levels[completedLevel].setCompleted();
            // Reset
            engine.setData('completed', false);
        }

        // Logo
        engine.addSprite(
            new Zepr.ImageSprite(
                engine.getImage('images/logo_small.png'),
                new Zepr.Rectangle(engine.width / 2, 96, 228, 192)));

        // Fullscreen mode
        engine.addSprite(
            new FullscreenSprite(
                engine.getImage('images/mode_fullscreen.png'), 
                engine.getImage('images/mode_window.png')));

        // Font
        this.font = new Zepr.Font('Schoolbell', 40, 'black');

        // Preloaded levels
        this.levels.forEach((m: MenuItem, idx: number): void => {
            engine.addSprite(m);
        });
    }

    run(engine: Zepr.Engine, deltaTime?: number): void {
        if (!this.uploadInProgress) {
            this.uploadInProgress = true;
            // Upload next level (if any)
            let level: string = 'data/scene';
            if (this.currentIndex < 10) {
                level += '0';
            }
            level += '' + this.currentIndex;
            level += '.json';

            Zepr.Net.get(level, (message: any): void => {
                let scene: Scene = <Scene>message;

                // Add new item to menu
                let level: MenuItem = new MenuItem(this.currentIndex, scene, engine.getImage('images/menu_box.png'), this.font);
                if (this.completed[this.currentIndex]) {
                    level.setCompleted();
                }

                this.levels.push(level);
                engine.addSprite(level);
                this.currentIndex++;
                this.uploadInProgress = false;
            });    
        }
    }
}