import {observer} from 'mobx-react';
import store, {colors} from "./store";

const config = ({
    arm_a: 9.5,
    arm_b: 12.5
});

const toRadians = (degrees) => (degrees / 180) * Math.PI;

const getTargetDistance = function (angle) {
    return (
        config.arm_a * Math.cos(angle) +
        Math.sqrt(config.arm_b ** 2 - (config.arm_a * Math.sin(angle)) ** 2)
    );
};

function Boolean({data}) {
    return <span className={(data ? 'text-green-500' : 'text-red-600') + ' font-bold'}>{data ? 'YES' : 'NO'}</span>
}

const Bucket = observer(({bucket}) => {
    const colorCode = colors[bucket === 0 ? 'B' : bucket === 1 ? 'O' : 'G'];

    return (
        <div style={{ width: '10em', height: '20em' }} className={'bg-gray-300 mr-3 relative'}>
            <div
                style={{
                    height: `${((40 - store.bucketDistances[bucket]) / 40) * 20}em`,
                    backgroundColor: colorCode, bottom: '0em'
                }}
                className={'absolute w-full transition-all'}
            >
                {bucket === 0 ? 'BLUE' : bucket === 1 ? 'ORANGE' : 'GREEN'}
            </div>
        </div>
    );
});

export default observer(
    function App() {
        const dist = getTargetDistance(toRadians(store.mainServoAngle + 45));
        const d = dist - 3;
        const f = d / (21.936397481235637 - 3);

        return (
            <div className="flex flex-row p-6">
                <div className={''}>
                    <div className="">
                        <div style={{width: '60em', height: '20em'}} className={'bg-blue-100 relative'}>
                            <div
                                style={{
                                    width: '10em',
                                    height: '10em',
                                    right: `${f*(60 - 10)}em`,
                                    transform: `rotate(${-1 * store.releaseServoAngle}deg)`,
                                    backgroundColor: colors[store.lastColor] ?? '#666'
                                }}

                                className={'absolute flex justify-center items-center'}>
                                CAR
                            </div>
                        </div>
                    </div>
                    <div>
                        <h1 className={'block font-bold text-3xl my-10'}>BUCKET STATE</h1>

                        <div className={'flex flex-row'}>
                            <Bucket bucket={0}/>
                            <Bucket bucket={1}/>
                            <Bucket bucket={2}/>
                        </div>
                    </div>
                </div>
                <div className={'w-80 ml-10'}>
                    <h1 className={'block font-bold text-3xl my-10'}>STATE</h1>

                    <pre>
                            READY: <Boolean data={store.isReady}/>{'\n'}
                        TRAVELING: <Boolean data={store.isTraveling}/> {store.isTraveling ? `(Station ${store.startStation} -- Station ${store.endStation})` : ''}{'\n'}
                        {'\n'}
                        {'   '}SERVO ANGLE (MAIN): {store.mainServoAngle}{'\n'}
                        {''}SERVO ANGLE (RELEASE): {store.releaseServoAngle}{'\n'}
                        {'\n'}
                        GATE STATE: {store.gateOpen ? 'OPEN' : 'CLOSED'}{'\n'}
                        {'\n'}
                        COLOR: {store.properColor}{'\n'}
                        {'\n'}
                        HUE: {store.lastHue}{'\n'}
                        LAST HUE TIME: {store.lastHueTime}{'\n'}
                        {'\n'}
                        HEIGHTS: {`${store.bucketDistances.join(' | ')}`}{'\n'}
                        </pre>
                </div>
            </div>
        )
    }
);
