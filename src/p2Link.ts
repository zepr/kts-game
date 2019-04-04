import Zepr = require('zepr.ts');

var p2 = require('p2');






export enum AnimationState {
    Active = 'active',
    Passive = 'passive'
}


export interface Animation {
    /**
     * Change frame in animation
     */
    nextFrame(): void;

    /**
     * Retrieve current image. Should always return the same frame till nextFrame() is called
     * 
     * @returns current animation image. 
     */
    getImage(): HTMLImageElement;

    /**
     * Change state of animation
     * @param state New state
     */
    setState(state: string): void;
}


export class SimpleAnimation implements Animation {

    private static readonly FRAMES_RATIO = 3;

    /** Change ratio between screen refresh rate and image refresh rate */
    currentRatioIndex;

    currentFrame: number;
    defaultSet: Array<HTMLImageElement>;
    activeSet: Array<HTMLImageElement>;

    images: Array<HTMLImageElement>;

    constructor(defaultSet: HTMLImageElement | Array<HTMLImageElement>,
        activeSet?: HTMLImageElement | Array<HTMLImageElement>) {

        if (defaultSet instanceof HTMLImageElement) {
            this.defaultSet = new Array<HTMLImageElement>();
            this.defaultSet.push(defaultSet);
        } else { // Array<HTMLImageElement>
            this.defaultSet = defaultSet;
        }

        this.images = this.defaultSet;

        if (activeSet != null) {
            if (activeSet instanceof HTMLImageElement) {
                this.activeSet = new Array<HTMLImageElement>();
                this.activeSet.push(activeSet);
            } else { // Array<HTMLImageElement>
                this.activeSet = activeSet;
            }
        }

        this.currentFrame = 0;
        this.currentRatioIndex = 0;
    }

    nextFrame(): void {

        this.currentRatioIndex++;
        if (this.currentRatioIndex >= SimpleAnimation.FRAMES_RATIO) {
            this.currentRatioIndex = 0;
            this.currentFrame = (this.currentFrame + 1) % this.images.length;
        }
    }    
    
    getImage(): HTMLImageElement {
        return this.images[this.currentFrame];
    }

    setState(state: string): void {
        if (this.activeSet == null) return; // Ignored

        switch (state) {
            case AnimationState.Active:
                this.images = this.activeSet;
            break;
            case AnimationState.Passive:
                this.images = this.defaultSet;
            break;
            default:
                // ignored
        }
        this.currentFrame %= this.images.length;
    }
}


export enum Material {
    Standard = 0,
    Bouncy = 1
}


export class ActionSprite extends Zepr.RawSprite<Zepr.Rectangle | Zepr.Circle> {

    private p2Body: any;

    private _isActive: boolean;

    private realActionArea: Zepr.Rectangle | Zepr.Circle;

    force: Zepr.Vector;

    /** List of objetcs linked to this object */
    private dependencies: Array<ActionSprite>;

    /** Collision detection area (Relative to the shape of current object) */
    private actionArea: Zepr.Rectangle | Zepr.Circle;
    /** Called when another object is in actionArea */
    private collision: (screen: P2Screen, self: ActionSprite, sprite: ActionSprite) => void;

    /** Called when activation state is changed */
    private activation: (screen: P2Screen, self: ActionSprite, isActive: boolean) => void;
    private activationStateChanged: boolean;

    constructor(
        protected _type: string,
        shape: Zepr.Rectangle | Zepr.Circle,
        protected animation: Animation,
        isActive: boolean,
        protected pivot?: Zepr.Point,
        protected material: Material = Material.Standard) {

        super(shape, 2);
        this._isActive = false;
        this.setActive(isActive);

        this.dependencies = new Array<ActionSprite>();
    }

    get type(): string {
        return this._type;
    }

    setActive(isActive: boolean): void {
        if (this._isActive == isActive) return;

        this._isActive = isActive;
        this.animation.setState(this._isActive ? AnimationState.Active : AnimationState.Passive);
        this.activationStateChanged = true;
    }

    setAction(actionArea: Zepr.Rectangle | Zepr.Circle, onCollision: (screen: P2Screen, self: ActionSprite, sprite: ActionSprite) => void) {
        this.actionArea = actionArea;
        this.collision = onCollision;
    }


    isActive(): boolean {
        return this._isActive;
    }

    onActivation(activation: (screen: P2Screen, self: ActionSprite, isActive: boolean) => void) {
        this.activation = activation;
    }

    getP2Body(): any {
        return this.p2Body;
    }

    setP2Body(p2Body: any): void {
        this.p2Body = p2Body;
    }

    getPivot(): Zepr.Point {
        return this.pivot;
    }

    getMaterial(): Material {
        return this.material;
    }

    /**
     * Get current rotation angle
     * 
     * @returns rotation angle in degrees
     */
    getRotation(): number {
        return this.shape.angle * 180 / Math.PI;
    }

    /**
     * Get current rotation angle
     * 
     * @returns rotation angle in radians
     */
    getRotationRad(): number {
        return this.shape.angle;
    }


    getActionRotation(): number {
        return (this.shape.angle + this.actionArea.angle) * 180 / Math.PI;
    }

    getActionRotationRad(): number {
        return this.shape.angle + this.actionArea.angle;
    }

    /**
     * Set new rotation angle 
     * @param degrees Rotation angle in degrees
     */
    public setRotation(degrees: number): void {
        if (this.shape.angle * 180 / Math.PI != degrees) {
            this.realActionArea = null;
            this.shape.rotate(degrees);
        }
    }

    /**
     * Set new rotation angle 
     * @param rad Rotation angle in radians
     */
    public setRotationRad(rad: number): void {
        if (this.shape.angle != rad) {
            this.realActionArea = null;
            this.shape.rotateRad(rad);
        }
    }

    /**
     * Adds angle to current rotation
     * @param degrees Rotation angle in degrees (delta)
     */
    addRotation(degrees: number): void {
        if (degrees != 0) {
            this.realActionArea = null;
            this.shape.rotateRad(this.shape.angle + degrees * Math.PI / 180);
        }
    }

    /**
     * Adds angle to current rotation
     * @param rad Rotation angle in radians (delta)
     */
    addRotationRad(rad: number): void {
        if (rad != 0) {
            this.realActionArea = null;
            this.shape.rotateRad(this.shape.angle + rad);
        }
    }

    public move(moveX: number, moveY: number): void;
    public move(vect: Zepr.Vector): void;
    public move(moveXOrVect: number | Zepr.Vector, moveY?: number): void {
        if (typeof(moveXOrVect) === 'number') {
            if (moveXOrVect != 0 || moveY != 0) {
                this.realActionArea = null;
                this.shape.move(moveXOrVect, moveY);
            }
        } else {
            if (moveXOrVect.x != 0 || moveXOrVect.y != 0) {
                this.realActionArea = null;
                this.shape.move(moveXOrVect);
            }
        }
    }


    public moveTo(coordX: number, coordY: number): void;
    public moveTo(point: Zepr.Point);
    public moveTo(coordXOrPoint: number | Zepr.Point, coordY?: number): void {
        if (typeof(coordXOrPoint) === 'number') {
            if (this.shape.x != coordXOrPoint || this.shape.y != coordY) {
                this.realActionArea = null;
                this.shape.moveTo(coordXOrPoint, coordY);
            }
        } else {
            if (this.shape.x != coordXOrPoint.x || this.shape.y != coordXOrPoint.y) {
                this.realActionArea = null;
                this.shape.moveTo(coordXOrPoint);
            }
        }
    }


    checkActivation(screen: P2Screen): void {

        if (this.activationStateChanged) {
            this.activationStateChanged = false;

            if (this.activation != null) {
                this.activation(screen, this, this._isActive);
            }    
        }
    }

    checkCollision(screen: P2Screen, sprite: ActionSprite): boolean {

        if (!this._isActive || this.actionArea == null || this.collision == null || sprite == null) return false;

        if (this.realActionArea == null) {
            // Update actionArea
            this.realActionArea = this.actionArea.clone();
            if (this.shape.angle == 0) {
                this.realActionArea.move(this.shape.x, this.shape.y);
            } else {
                this.realActionArea.rotateRad(this.actionArea.angle + this.shape.angle);
                if (this.actionArea.x == 0 && this.actionArea.y == 0) {
                    this.realActionArea.moveTo(this.shape.x, this.shape.y);
                } else {
                    let v: Zepr.Vector = new Zepr.Vector(this.actionArea.x, this.actionArea.y).rotateRad(this.shape.angle);
                    this.realActionArea.moveTo(this.shape.x + v.x, this.shape.y + v.y);
                }
            }
        }

        if (this.realActionArea.collides(sprite.getShape())) {
            this.collision(screen, this, sprite);
            return true;
        }

        return false;
    }


    resetForce(): void {
        if (this.force != null) {
            this.force.set(0, 0);
        }
    }

    addForce(x: number, y: number): void;
    addForce(v: Zepr.Vector): void;
    addForce(XOrVect: number | Zepr.Vector, y?: number) {
        if (this.p2Body == null) return;

        if (this.force == null) this.force = new Zepr.Vector();

        if (typeof(XOrVect) === 'number') {
            this.force.add(XOrVect, y);
        } else {
            this.force.add(XOrVect.x, XOrVect.y);
        }
    }


    getImage(): HTMLImageElement {
        return this.animation.getImage();
    }


    update(): void {
        this.animation.nextFrame();
    }

    addDependency(sprite: ActionSprite): void {
        this.dependencies.push(sprite);
    }

    getDependencies(): Array<ActionSprite> {
        return this.dependencies;
    }

    render(context: CanvasRenderingContext2D): void {

        /*
        // TODO : Pour test
        // ActionArea
        if (this.realActionArea != null && this._isActive) {
            context.fillStyle = 'red';
            if (this.realActionArea instanceof Zepr.Rectangle) {
                context.save();
                context.translate(this.realActionArea.x, this.realActionArea.y);
                context.rotate(this.realActionArea.angle);
                context.fillRect(-(<Zepr.Rectangle>this.realActionArea).width / 2, -(<Zepr.Rectangle>this.realActionArea).height / 2, 
                    (<Zepr.Rectangle>this.realActionArea).width, (<Zepr.Rectangle>this.realActionArea).height);
                context.restore();    
            } else { // Zepr.Circle
                context.beginPath();
                context.arc(this.realActionArea.x, this.realActionArea.y, (<Zepr.Circle>this.realActionArea).radius, 0, 2 * Math.PI, false);
                context.fill();        
            }
        }
        */

        let image: HTMLImageElement = this.animation.getImage();

        if (image.complete) {
            if (this.shape.angle == 0) {
                context.drawImage(image, this.shape.x - image.width / 2, this.shape.y - image.height / 2);
            } else {
                context.save();
                context.translate(this.shape.x, this.shape.y);
                context.rotate(this.shape.angle);
                context.drawImage(image, -image.width / 2, -image.height / 2);
                context.restore();
            }
        }

    }
}




 


export abstract class P2Screen implements Zepr.GameScreen {

    static readonly FIXED_TIME_STEP: number = 1 / 60;
    static readonly MAX_SUB_STEP: number = 10;

    private world: any;

    private engine: Zepr.Engine;

    private standardMaterial: any;
    private bouncyMaterial: any;

    private borders: Array<any>;

    /** Used for constraints */
    private dummyBody: any;

    private actionSprites: Array<ActionSprite>;

    /** If p2 simulation is running */
    private isRunning: boolean;

    init(engine: Zepr.Engine): void {

        this.engine = engine;

        // Define Dummy Body
        this.dummyBody = new p2.Body({ mass: 0 });

        // Define Materials
        this.standardMaterial = new p2.Material();
        this.bouncyMaterial = new p2.Material();

        // Set world
        this.resetWorld(engine);

        // Init sprite set
        this.actionSprites = new Array<ActionSprite>();

        this.initGame(engine);
    }

    abstract initGame(engine: Zepr.Engine);


    resetWorld(engine: Zepr.Engine): void {

        if (this.world) {
            // TODO : Désallocation des objets?
            // TODO : Eviter toute fuite mémoire
        }

        this.world = new p2.World({
            gravity: [0, 9.8]
        });

        this.world.addBody(this.dummyBody);
        var contactMatStd = new p2.ContactMaterial(this.standardMaterial, this.standardMaterial, { friction: 0.5, restitution: 0.3 });
        this.world.addContactMaterial(contactMatStd);
        this.world.addContactMaterial(new p2.ContactMaterial(this.standardMaterial, this.bouncyMaterial, { friction: 0.05, restitution: 1.5 }));
        this.world.addContactMaterial(new p2.ContactMaterial(this.bouncyMaterial, this.bouncyMaterial, { friction: 0, restitution: 2 }));

        this.world.on('postStep', this.runP2.bind(this));
    }
        


    addBorders(engine: Zepr.Engine, borders?: Array<Zepr.Rectangle>) {
        if (borders == null) {
            this.borders = new Array<any>();
            // Default borders (screen view)
            this.borders.push(new Zepr.Rectangle(engine.width >> 1, engine.height + 50, engine.width, 100));
            this.borders.push(new Zepr.Rectangle(engine.width >> 1, -50, engine.width, 100));
            this.borders.push(new Zepr.Rectangle(-50, engine.height >> 1, 100, engine.height));
            this.borders.push(new Zepr.Rectangle(engine.width + 50, engine.height >> 1, 100, engine.height));
        } 

        borders.forEach((r: Zepr.Rectangle): void => {
            let b: any = new p2.Body({ mass: 0, position: [r.x, r.y], angle: r.angle });
            b.addShape(new p2.Box({ width: r.width, height: r.height }));
            this.world.addBody(b);
        });
        this.borders = borders;
    }

    getBorders(): Array<Zepr.Rectangle> {
        return this.borders;
    }


    addActionSprite(sprite: ActionSprite, mass: number = 0): void {

        // P2
        let p2Body = new p2.Body({
            mass: (mass < 0 ? -mass : mass),
            position: [sprite.getShape().x, sprite.getShape().y],
            angle: sprite.getShape().angle,
            gravityScale: (mass < 0 ? -1 : 1)
        });

        // Material
        let m: any = this.standardMaterial;
        switch (sprite.getMaterial()) {
            case Material.Bouncy:
                m = this.bouncyMaterial;
            break;
        }


        if (sprite.getShape() instanceof Zepr.Circle) {
            let circleShape = new p2.Circle({ radius: (<Zepr.Circle>sprite.getShape()).radius, material: m });
            p2Body.addShape(circleShape);
        } else { // rect
            let boxShape = new p2.Box({ width: (<Zepr.Rectangle>sprite.getShape()).width, height: (<Zepr.Rectangle>sprite.getShape()).height, material: m });
            p2Body.addShape(boxShape);
        }

        this.world.addBody(p2Body);
        sprite.setP2Body(p2Body);

        // Pivot management
        if (sprite.getPivot() != null) {
            let v: Zepr.Vector = new Zepr.Vector(sprite.getPivot().x, sprite.getPivot().y);
            v.rotateRad(sprite.getShape().angle);

            let constraint: any = new p2.RevoluteConstraint(
                p2Body, this.dummyBody,
                {
                    worldPivot: [sprite.getShape().x + v.x, sprite.getShape().y + v.y],
                    collideConnected: false
                }
            );
            this.world.addConstraint(constraint);
        }

        // Renderer
        this.engine.addSprite(sprite);
        this.actionSprites.push(sprite);
    }


    removeActionSprite(sprite: ActionSprite) {

        let p2Body: any = sprite.getP2Body();
        if (p2Body != null) {
            this.world.removeBody(p2Body);
            sprite.setP2Body(null);
        }

        let idx: number = this.actionSprites.indexOf(sprite);
        if (idx > -1) {
            this.actionSprites.splice(idx, 1);
        }

        this.engine.removeSprite(sprite);
    }


    move(sprite: ActionSprite, move: Zepr.Vector): void {

        let p2Body: any = sprite.getP2Body();
        if (p2Body != null) {
            p2Body.position[0] += move.x;
            p2Body.position[1] += move.y;
        }

        sprite.move(move);
    }

    moveTo(sprite: ActionSprite, move: Zepr.Point): boolean {
        let p2Body: any = sprite.getP2Body();
        if (p2Body == null) return false;

        p2Body.position[0] = move.x;
        p2Body.position[1] = move.y;
        sprite.moveTo(move);

        return true;
    }


    isStatic(sprite: ActionSprite): boolean {
        let p2Body: any = sprite.getP2Body();
        if (p2Body == null) return true;

        return p2Body.type == 2;
    }

    updateMass(sprite: ActionSprite, mass: number): boolean {

        let p2Body: any = sprite.getP2Body();
        if (p2Body == null) return false;

        if (mass == 0) {
            p2Body.type = 2; // STATIC
        } else {
            p2Body.type = 1; // DYNAMIC
        }
        p2Body.mass = (mass < 0 ? -mass : mass);
        p2Body.gravityScale = (mass < 0 ? -1 : 1);
        p2Body.updateMassProperties();

        return true;
    }


    rotate(sprite: ActionSprite, degrees: number): boolean {
        let p2Body: any = sprite.getP2Body();
        if (p2Body == null) return false;
            
        sprite.addRotation(degrees);
        p2Body.angle = sprite.getShape().angle;

        return true;
    }

    rotateRad(sprite: ActionSprite, radians: number): boolean {
        let p2Body: any = sprite.getP2Body();
        if (p2Body == null) return false;
        
        sprite.addRotationRad(radians);
        p2Body.angle = sprite.getShape().angle;

        return true;
    }


    getSprites(): Array<ActionSprite> {
        return this.actionSprites;
    }

    private runP2(): void {

        this.actionSprites.forEach((sprite: ActionSprite): void => {
            if (sprite.force != null && (sprite.force.x != 0 || sprite.force.y != 0)) {
                sprite.getP2Body().force[0] = sprite.force.x;
                sprite.getP2Body().force[1] = sprite.force.y;
            }
        });
    }

    run(engine: Zepr.Engine, deltaTime: number): void {
        if (this.isRunning) {
            this.world.step(P2Screen.FIXED_TIME_STEP, deltaTime, P2Screen.MAX_SUB_STEP);

            // Reset forces
            this.actionSprites.forEach((sprite : ActionSprite): void => {
                sprite.resetForce();
            });    

            this.actionSprites.forEach((sprite : ActionSprite): void => {
                // Move
                sprite.moveTo(sprite.getP2Body().interpolatedPosition[0], sprite.getP2Body().interpolatedPosition[1]);
                sprite.getShape().rotateRad(sprite.getP2Body().interpolatedAngle);

                // Check action
                if (sprite.isActive()) {
                    this.actionSprites.forEach((otherSprite: ActionSprite): void => {
                        if (sprite != otherSprite) {
                            sprite.checkCollision(this, otherSprite);
                        }
                    });
                }

                // Check state change
                sprite.checkActivation(this);

                // Update view
                sprite.update();
            });
        }

        this.runGame(engine);
    }

    startWorld(): void {
        this.isRunning = true;
    }

    stopWorld(): void {
        this.isRunning = false;
    }

    isActive(): boolean {
        return this.isRunning;
    }


    abstract runGame(engine: Zepr.Engine);
}
