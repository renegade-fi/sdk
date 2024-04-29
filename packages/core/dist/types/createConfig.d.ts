import { type Storage } from "./createStorage.js";
import type { Evaluate, ExactPartial } from "./types/utils.js";
import type * as rustUtils from "./utils.d.ts";
import type { Address, Hex } from "viem";
import { type Mutate, type StoreApi } from "zustand/vanilla";
export type CreateConfigParameters = {
    darkPoolAddress: Address;
    priceReporterUrl: string;
    relayerUrl: string;
    httpPort?: number;
    pollingInterval?: number;
    ssr?: boolean | undefined;
    storage?: Storage | null | undefined;
    utils?: typeof rustUtils;
    websocketPort?: number;
};
export declare function createConfig(parameters: CreateConfigParameters): Config;
export type Config = {
    darkPoolAddress: Address;
    getPriceReporterBaseUrl: () => string;
    getRelayerBaseUrl: (route?: string) => string;
    getWebsocketBaseUrl: () => string;
    pollingInterval: number;
    priceReporterUrl: string;
    relayerUrl: string;
    setState: (newState: State) => void;
    state: State;
    subscribe<state>(selector: (state: State) => state, listener: (state: state, previousState: state) => void, options?: {
        emitImmediately?: boolean | undefined;
        equalityFn?: ((a: state, b: state) => boolean) | undefined;
    } | undefined): () => void;
    utils: typeof rustUtils;
    /**
     * Not part of versioned API, proceed with caution.
     * @internal
     */
    _internal: {
        readonly store: Mutate<StoreApi<any>, [["zustand/persist", any]]>;
        readonly ssr: boolean;
    };
};
export interface State {
    seed?: Hex | undefined;
    status?: "in relayer" | "disconnected" | "looking up" | "creating wallet" | "connecting";
    id?: string | undefined;
}
export type PartializedState = Evaluate<ExactPartial<Pick<State, "id" | "seed" | "status">>>;
//# sourceMappingURL=createConfig.d.ts.map