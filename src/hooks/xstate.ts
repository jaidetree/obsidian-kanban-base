import { MutableRef, useEffect, useRef, useState } from "preact/hooks";
import {
	createActor,
	type AnyStateMachine,
	type SnapshotFrom,
	Actor,
	AnyActorLogic,
} from "xstate";

export type SendFrom<TMachine extends AnyActorLogic> = Actor<TMachine>["send"];

export type ActorRef<TMachine extends AnyActorLogic> = MutableRef<
	Actor<TMachine>
>;

export function useActor<M extends AnyStateMachine>(
	machine: M,
	options?: Parameters<typeof createActor<M>>[1],
): ActorRef<M> {
	const actorRef = useRef<Actor<M> | null>(null);

	if (!actorRef.current) {
		actorRef.current = createActor(machine, options);
		actorRef.current.start();
	}

	return actorRef as MutableRef<Actor<M>>;
}

export function useActorState<T extends AnyStateMachine>(
	actorRef: ActorRef<T>,
): [SnapshotFrom<T>, SendFrom<T>] {
	const [snapshot, setSnapshot] = useState(() =>
		actorRef.current!.getSnapshot(),
	);

	useEffect(() => {
		const sub = actorRef.current!.subscribe((s) => setSnapshot(s));
		return () => sub.unsubscribe();
	}, []);

	return [snapshot, actorRef.current!.send];
}

export function useXState<M extends AnyStateMachine>(
	machine: M,
	options?: Parameters<typeof createActor<M>>[1],
) {
	const actorRef = useActor(machine, options);

	return useActorState<M>(actorRef);
}
