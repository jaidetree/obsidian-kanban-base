import { useEffect, useRef, useState } from 'preact/hooks';
import { createActor, type AnyStateMachine, type SnapshotFrom, type ActorRefFrom } from 'xstate';

export function useXState<M extends AnyStateMachine>(
	machine: M,
	options?: Parameters<typeof createActor<M>>[1],
): [SnapshotFrom<M>, ActorRefFrom<M>['send']] {
	const actorRef = useRef<ReturnType<typeof createActor<M>> | null>(null);
	if (!actorRef.current) {
		actorRef.current = createActor(machine, options);
		actorRef.current.start();
	}
	const [snapshot, setSnapshot] = useState(() => actorRef.current!.getSnapshot());
	useEffect(() => {
		const sub = actorRef.current!.subscribe(s => setSnapshot(s as SnapshotFrom<M>));
		return () => sub.unsubscribe();
	}, []);
	// eslint-disable-next-line @typescript-eslint/unbound-method
	return [snapshot, actorRef.current.send as ActorRefFrom<M>['send']];
}
