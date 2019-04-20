import Zepr = require('zepr.ts');
import { KtsGameScreen } from './ktsGame';
import { KtsMenuScreen } from './ktsMenu';



class KtsLoaderScreen implements Zepr.LoaderScreen {
    
    private loaderSprite: LoaderSprite;
    
    init(engine: Zepr.Engine): void {

        let shadok: Array<HTMLImageElement> = new Array<HTMLImageElement>();
        for (let i: number = 1; i <= 4; i++) {
            shadok.push(engine.getImage('images/pedal' + i + '.png'));
        }
        this.loaderSprite = new LoaderSprite(shadok, engine.getImage('images/progress.png'));

        engine.setBackgroundColor('#FFFFFF');
        engine.addSprite(this.loaderSprite);
    }    
    
    run(engine: Zepr.Engine, stats: Zepr.LoaderStats): void {
        this.loaderSprite.update(stats);
    }
}


class LoaderSprite extends Zepr.RawSprite<Zepr.Rectangle> {

    private static readonly FRAMERATE = 4;

    private framerate: number;
    private imgIdx: number;
    private progress: number;

    constructor(private shadok: Array<HTMLImageElement>, private progressImg: HTMLImageElement) {
        super(new Zepr.Rectangle(640, 360, 1280, 720));

        this.framerate = 0;
        this.imgIdx = 0;
        this.progress = 0;
    }

    render(context: CanvasRenderingContext2D): void {
        if (this.shadok[this.imgIdx].complete) {
            context.drawImage(
                this.shadok[this.imgIdx], 
                this.getX() - this.shadok[this.imgIdx].width / 2, 
                this.getY() - this.shadok[this.imgIdx].height / 2);

            this.framerate++;
            if (this.framerate >= LoaderSprite.FRAMERATE) {
                this.framerate = 0;
                this.imgIdx++;
                this.imgIdx %= this.shadok.length;
            }
        }

        if (this.progressImg.complete && this.progress > 0) {
            context.save();

            context.beginPath();
            context.rect(640 - this.progressImg.width / 2, 500, this.progressImg.width * this.progress, this.progressImg.height);
            context.clip();
            context.drawImage(this.progressImg, 640 - this.progressImg.width / 2, 500);
            
            context.restore();
        }
    }

    update(stats: Zepr.LoaderStats) {
        this.progress = stats.loaded / stats.total;
    }
}



window.onload = () => {
    let engine = new Zepr.Engine(1280, 720, new KtsLoaderScreen());
    engine.enableMouseControl(Zepr.MouseEventType.DELEGATE);
    engine.enableMouseDrag();

    engine.addScreen('menu', new KtsMenuScreen());
    engine.addScreen('game', new KtsGameScreen());
    engine.start('menu');
};
