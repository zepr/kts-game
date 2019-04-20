import Zepr = require('zepr.ts');

import { ActionSprite, P2Screen } from './p2Link';

import { Scene, ObjectDefinition, ObjectFactory, SpareObjectDefinition } from './ktsObjects';




interface SpareObject {
    type: string;
    rotation: number;
    image: HTMLImageElement;
}


class ExitSprite extends Zepr.ImageSprite implements Zepr.Clickable {
    onClick(engine: Zepr.Engine, screen: Zepr.GameScreen, point: Zepr.Point): void {
        // Reset content
        engine.setData('scene', null);
        // Back to menu
        engine.start('menu');
    }
}


class GameRulerSprite extends Zepr.RawSprite<Zepr.Rectangle> implements Zepr.Clickable {

    private grCanvas: HTMLCanvasElement;
    private grContext: CanvasRenderingContext2D;
    private gradient: CanvasGradient;

    private needUpdate: boolean;

    private objects: Array<SpareObject>;

    public constructor(
        private boxImage: HTMLImageElement) {
        super(Zepr.Rectangle.asRect(1180, 0, 100, 620), 1);

        this.objects = new Array<SpareObject>();

        this.grCanvas = document.createElement('canvas');
        this.grCanvas.width = 100;
        this.grCanvas.height = 620;
        this.grContext = this.grCanvas.getContext('2d');

        this.gradient = this.grContext.createLinearGradient(0, 0, 0, 620);
        this.gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        this.gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
        this.gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');

        this.needUpdate = true;
    }

    addSpareObject(object: SpareObject): void {
        this.objects.push(object);
        this.needUpdate = true;
    }

    render(context: CanvasRenderingContext2D): void {
        if (this.needUpdate) {
            this.grContext.clearRect(0, 0, this.grCanvas.width, this.grCanvas.height);
            this.grContext.globalCompositeOperation = 'source-over';
            this.objects.forEach((obj: SpareObject, idx: number): void => {
                if (idx < 7) {
                    // Object
                    this.grContext.save();
                    this.grContext.translate(52, 100 * idx + 50);
                    this.grContext.rotate(obj.rotation * Math.PI / 180);
                    this.grContext.drawImage(obj.image, -obj.image.width / 2, -obj.image.height / 2);
                    this.grContext.restore();
                    // Box
                    this.grContext.drawImage(this.boxImage, 52 - (this.boxImage.width / 2), 100 * idx + 50 - (this.boxImage.height / 2));
                }
            })
            this.grContext.globalCompositeOperation = 'destination-out';
            this.grContext.fillStyle = this.gradient;
            this.grContext.fillRect(0, 0, 100, 620);
    
            this.needUpdate = false;
        }

        context.drawImage(this.grCanvas, 1180, 0);
    }

    onClick(engine: Zepr.Engine, screen: Zepr.GameScreen, point: Zepr.Point): void {
        let idx: number = Math.floor(point.y / 100);

        let px: number = 1232;
        let py: number = idx * 100 + 50;

        if (this.objects.length > idx && new Zepr.Rectangle(px, py, 86, 86).contains(point)) {
            // Build new MovableActionSprite
            let type: string = this.objects[idx].type;
            let shape: Zepr.Circle | Zepr.Rectangle = ObjectFactory.getShape(type);
            shape.moveTo(px, py);

            let sprite: MovableSprite = new MovableSprite(
                type,
                this.objects[idx].image,
                shape,
                this.objects[idx].rotation
            );

            // Register object
            (<KtsGameScreen>screen).setMoving(sprite);
            engine.addSprite(sprite);

            // Remove object from spare list and update view
            this.objects.splice(idx, 1);
            this.needUpdate = true;
        }
    }
}


class MovableSprite extends Zepr.ImageSprite implements Zepr.Clickable {

    private stdImage: HTMLImageElement;
    private redImage: HTMLImageElement;

    private _isValid: boolean;

    constructor(
        private type: string,
        image: HTMLImageElement,
        shape: Zepr.Rectangle | Zepr.Circle,
        rotation: number) {

        super(image, shape.rotate(rotation));

        this.stdImage = MovableSprite.changeColor(image, 2, 90);
        this.redImage = MovableSprite.changeColor(image, 0, 120);
        
        this.setValid(false);
    }

    /**
     * Force value of an RGB component
     * @param source source image
     * @param indice component to saturate (R=0, G=1, B=2)
     * @param value new value of component (0-255)
     */
    private static changeColor(source: HTMLImageElement, indice: number, value: number): HTMLImageElement {

        let canvas: HTMLCanvasElement = document.createElement('canvas');
        canvas.width = source.width;
        canvas.height = source.height;
        let context: CanvasRenderingContext2D = canvas.getContext('2d');

        context.drawImage(source, 0, 0);
        let content: ImageData = context.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = indice; i < content.data.length; i+=4) {
            content.data[i] = value;
        }
        context.putImageData(content, 0, 0);

        let dest: HTMLImageElement = new Image();
        dest.src = canvas.toDataURL('image/png');

        return dest;
    }

    setValid(isValid: boolean): void {
        this._isValid = isValid;
        this.setImage(isValid ? this.stdImage : this.redImage);
    }

    isValid(): boolean {
        return this._isValid;
    }

    getType(): string {
        return this.type;
    }

    onClick(engine: Zepr.Engine, screen: Zepr.GameScreen, point: Zepr.Point): void {
        (<KtsGameScreen>screen).setMoving(this);
    }
}


class ControlSprite extends Zepr.ImageSprite implements Zepr.Clickable {

    public constructor(
        private play: HTMLImageElement, private stop: HTMLImageElement) {
        super(play, new Zepr.Circle(1230, 670, 37), 1);
    }

    onClick(engine: Zepr.Engine, screen: Zepr.GameScreen, point: Zepr.Point): void {
        let scr: KtsGameScreen = <KtsGameScreen>screen;
        if (scr.isActive()) {
            this.setImage(this.play);
            scr.stop(engine);
        } else {
            this.setImage(this.stop);
            scr.start(engine);
        }
    }

}


class PopupSprite extends Zepr.RawSprite<Zepr.Rectangle> {

    private text: Zepr.Text;
    private level: Zepr.Text;
    private topImage: HTMLImageElement;

    public constructor(
        index: number,
        private box: HTMLImageElement, textOrImage: string | HTMLImageElement) {
        super(new Zepr.Rectangle(640, 360, 340, 218), 1000);

        let font: Zepr.Font = new Zepr.Font('Schoolbell', 28, 'black');
        this.level = new Zepr.Text('Niveau ' + (index + 1), new Zepr.Point(445, 280), 400, font, Zepr.TextAlign.CENTER);

        if (textOrImage instanceof HTMLImageElement) {
            this.topImage = textOrImage;
            this.text = new Zepr.Text('Félicitations!', new Zepr.Point(630, 346), 400, font, Zepr.TextAlign.JUSTIFY);
        } else { // string
            this.text = new Zepr.Text(textOrImage, new Zepr.Point(520, 335), 240, font, Zepr.TextAlign.JUSTIFY);
        }
    }

    render(context: CanvasRenderingContext2D): void {
        context.drawImage(this.box, this.shape.x - this.shape.width / 2, this.shape.y - this.shape.height / 2);
        this.level.render(context);
        this.text.render(context);
        if (this.topImage) {
            context.drawImage(this.topImage, this.shape.x - this.shape.width / 2 - 10, this.shape.y - this.shape.height / 2 + 30);
        }
    }    
}


class RemoveSprite extends Zepr.RawSprite<Zepr.Circle | Zepr.Rectangle> {

    private static readonly NB_FRAMES = 12;

    index: number;

    public constructor(
        private image: HTMLImageElement,
        position: Zepr.Circle | Zepr.Rectangle) {

        super(position, 100);

        this.index = 0;
    }

    render(context: CanvasRenderingContext2D): void {

        let alpha: number = (RemoveSprite.NB_FRAMES - this.index) / RemoveSprite.NB_FRAMES;
        
        this.index++;

        if (this.image.complete) {
            context.save();
            context.globalAlpha = alpha;
            context.translate(this.shape.x, this.shape.y);
            context.rotate(this.shape.angle);
            context.scale(2 - alpha, 2 - alpha);
            context.drawImage(this.image, -this.image.width / 2, -this.image.height / 2);
            context.restore();
        }        
    }

    isComplete(): boolean {
        return this.index > RemoveSprite.NB_FRAMES;
    }
}



export class KtsGameScreen extends P2Screen implements Zepr.ClickListener, Zepr.DragListener {

    images: Array<string> = [
        'images/popup.png', 'images/play.png', 'images/stop.png', 'images/separator.png', 'images/box.png',
        'images/escape.png', 'images/sel_ok.png', 'images/sel_ko.png', 'images/win.png',
        'images/pikes.png', 'images/pin.png', 'images/trap.png', 'images/trap_a.png',
        'images/shadok.png', 'images/mace.png', 'images/block.png', 'images/swing.png', 'images/trampo.png',
        'images/lrunner_a1.png', 'images/lrunner_a2.png', 'images/lrunner_a3.png', 'images/lrunner_a4.png',
        'images/rrunner_a1.png', 'images/rrunner_a2.png', 'images/rrunner_a3.png', 'images/rrunner_a4.png',
        'images/balloon.png', 'images/button.png', 'images/button_a.png', 'images/ball.png',
        'images/dryer.png', 'images/dryer_a1.png', 'images/dryer_a2.png', 'images/dryer_a3.png', 'images/dryer_a4.png',
        'images/vacuum.png', 'images/vacuum_a1.png', 'images/vacuum_a2.png', 'images/vacuum_a3.png', 'images/vacuum_a4.png',
        'images/elec.png', 'images/elec_a1.png', 'images/elec_a2.png', 'images/elec_a3.png', 'images/elec_a4.png'
    ];


    moving: MovableSprite;
    movable: Array<MovableSprite>;

    private toRemove: Array<ActionSprite>;
    private removing: Array<RemoveSprite>;

    private playButton: ControlSprite;

    private ruler: GameRulerSprite;

    private scene: Scene;

    private exitSprite: ExitSprite;

    private startSprite: PopupSprite;
    private endSprite: PopupSprite;

    private level: number;

    constructor() {
        super();

        this.toRemove = new Array<ActionSprite>();
        this.removing = new Array<RemoveSprite>();

        this.movable = new Array<MovableSprite>();
    }

    initGame(engine: Zepr.Engine) {

        this.toRemove.length = 0;
        this.removing.length = 0;
        this.movable.length = 0;

        // p2 borders
        this.addBorders(engine, [            
            new Zepr.Rectangle(engine.width / 2, engine.height + 50, engine.width, 100),
            new Zepr.Rectangle(engine.width / 2, -50, engine.width, 100),
            new Zepr.Rectangle(-50, engine.height / 2, 100, engine.height),
            new Zepr.Rectangle(engine.width - 50, engine.height / 2, 100, engine.height),
        ]);

        // Escape button
        this.exitSprite = new ExitSprite(engine.getImage('images/escape.png'),
            new Zepr.Rectangle(30, 30, 48, 48), 99
        );
        engine.addSprite(this.exitSprite);

        // Separator
        engine.addSprite(
            new Zepr.ImageSprite(
                engine.getImage('images/separator.png'),
                new Zepr.Rectangle(engine.width - 100, engine.height /2, 1, engine.height)));


        // Spare objects list
        this.ruler = new GameRulerSprite(engine.getImage('images/box.png'));
        engine.addSprite(this.ruler);

        // Controls
        this.playButton = new ControlSprite(
            engine.getImage('images/play.png'),
            engine.getImage('images/stop.png')
        );
        engine.addSprite(this.playButton);

        this.endSprite = null;

        // Level index
        this.level = engine.getData('level');

        // Objects
        this.scene = engine.getData('scene');

        if (this.scene != null) {
            engine.setBackgroundColor(this.scene.color);

            this.scene.objects.forEach((def: ObjectDefinition): void => {
                ObjectFactory.getActionSprite(engine, this, def);
            });

            this.scene.spare.forEach((spareDef: SpareObjectDefinition): void => {
                this.ruler.addSpareObject({
                    type: spareDef.type,
                    rotation: spareDef.rotation ? spareDef.rotation : 0,
                    image: engine.getImage(ObjectFactory.getImage(spareDef.type))
                });
            });

            this.startSprite = new PopupSprite(this.level, engine.getImage('images/popup.png'), this.scene.description);            
            engine.addSprite(this.startSprite);
        }
    }    


    runGame(engine: Zepr.Engine) {
        // Check for end of game
        if (this.endSprite == null && !this.getSprites().some((s: ActionSprite): boolean => { return s.type == 'shadok' })) {
            this.endSprite = new PopupSprite(this.level, engine.getImage('images/popup.png'), engine.getImage('images/win.png'));
            engine.addSprite(this.endSprite);
            engine.setData('completed', true);
        }

        // Find sprites that must be removed
        while (this.toRemove.length > 0) {
            let remove: ActionSprite = this.toRemove.pop();
            super.removeActionSprite(remove);

            let removeSprite: RemoveSprite = new RemoveSprite(
                remove.getImage(), remove.getShape()
            );

            this.removing.push(removeSprite);
            engine.addSprite(removeSprite); 
        }

        // Animate removed sprites
        this.removing.forEach((sprite: RemoveSprite, idx: number): void => {
            if (sprite.isComplete()) {
                engine.removeSprite(sprite);
                this.removing.splice(idx, 1);
            }
        });
    }


    removeActionSprite(sprite: ActionSprite) {
        this.toRemove.push(sprite);
    }


    setMoving(sprite: MovableSprite) {
        this.moving = sprite;
        
        let idx = this.movable.indexOf(this.moving);
        if (idx > -1) {
            this.movable.splice(idx, 1);
        }
    }


    onClick(engine: Zepr.Engine, point: Zepr.Point, sprites: Zepr.Sprite<any>[]): boolean {

        // Hide start popup if displayed
        if (this.startSprite) {
            engine.removeSprite(this.startSprite);
            this.startSprite = null;
            return false;
        }

        // End of game
        if (this.endSprite) {
            this.stopWorld();
            engine.start('menu');
            return false;
        }

        // When running, only playButton is active
        if (this.isActive()) {
            if (sprites.indexOf(this.playButton) > -1) {
                this.playButton.onClick(engine, this, point);
            }
            return false;
        }
        
        return true;
    }

    onDrag(engine: Zepr.Engine, move: Zepr.Vector): void {
        if (this.moving != null) {
            this.moving.move(move);

            let collide: boolean;

            // Check collision with borders
            collide = this.getBorders().some((rect: Zepr.Rectangle): boolean => {
                return rect.collides(this.moving.getShape());
            });

            // Check collision with ActionSprite
            if (!collide) {
                collide = this.getSprites().some((spr: Zepr.Sprite<any>): boolean => {
                    return spr.collides(this.moving.getShape());
                });
            }

            // Check collision with MovableSprite
            if (!collide) {
                collide = this.movable.some((spr: Zepr.Sprite<any>): boolean => {
                    if (spr != this.moving) {
                        return spr.collides(this.moving.getShape());
                    }
                    return false;
                });
            }


            this.moving.setValid(!collide);
        }
    }

    onDrop(engine: Zepr.Engine): void {
        if (this.moving) {            
            if (this.moving.isValid()) {
                // Add to movable list
                this.movable.push(this.moving);
            } else {
                // Restore standard image
                this.moving.setValid(true);
                // Move back to spare (End of list)
                this.ruler.addSpareObject({
                    type: this.moving.getType(),
                    rotation: this.moving.getRotation(),
                    image: engine.getImage(ObjectFactory.getImage(this.moving.getType()))
                });
                // Remove current sprite
                engine.removeSprite(this.moving);
            }

            this.moving = null;
        }
    }


    start(engine: Zepr.Engine): void {

        // Remove ExitSprite
        engine.removeSprite(this.exitSprite);

        // Convert MovableSprites
        this.movable.forEach((movable: MovableSprite): void => {
            // Remove old object
            engine.removeSprite(movable);

            // Add new ActionSprite
            ObjectFactory.getActionSprite(engine, this, {
                type: movable.getType(),
                x: movable.getX(),
                y: movable.getY(),
                rotation: movable.getRotation(),
                active: true
            });
        });

        // start
        this.startWorld();
    }


    stop(engine: Zepr.Engine): void {

        this.stopWorld();

        // Remove all sprites
        while (this.getSprites().length > 0) {
            super.removeActionSprite(this.getSprites()[0]);
        }

        // Add ExitSprite
        engine.addSprite(this.exitSprite);

        // Reset world
        this.resetWorld(engine);

        // Add borders
        this.addBorders(engine, this.getBorders());

        // Restore initial content
        this.scene.objects.forEach((def: ObjectDefinition): void => {
            ObjectFactory.getActionSprite(engine, this, def);
        });

        // Restore MovableSprites
        this.movable.forEach((movable: MovableSprite): void => {
            engine.addSprite(movable);
        });   
    }

}



