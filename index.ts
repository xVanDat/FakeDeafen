import definePlugin from "@utils/types";
import { FluxDispatcher, Toasts } from "@webpack/common";

let previousOutputVolume: number | null = null;
let previousInputVolume: number | null = null;
let isFakeDeafened = false;
let originalWsSend: any = null;

// Global declaration for Vencord Webpack API
declare const Vencord: any;

function getConfigModule() {
    return Vencord.Webpack.findByPropsLazy?.("getOutputVolume") ?? null;
}

let interceptor: ((e: any) => void) | null = null;

export default definePlugin({
    name: "FakeDeafen",
    description: "Fake deafen by muting local input/output without notifying the server. Note: When you click, your deafen status in the bottom left corner will remain white, but rest assured, you will not hear anything.",
    authors: [{ id: 0n, name: "xVanDat" }],

    start() {
        // 1. Chặn WebSocket send để ép self_deaf luôn false khi gửi đi
        originalWsSend = window.WebSocket.prototype.send;
        window.WebSocket.prototype.send = function (data: any) {
            if (isFakeDeafened && typeof data === "string" && data.includes('"self_deaf":true')) {
                // Thay thế chuỗi JSON trước khi gửi lên server
                data = data.replace(/"self_deaf":\s*true/g, '"self_deaf":false');
                data = data.replace(/"self_mute":\s*true/g, '"self_mute":false'); // Patch luôn mute nếu cần
            }
            return originalWsSend.apply(this, [data]);
        };

        // 2. Vẫn lắng nghe event để xử lý âm lượng, nhưng KHÔNG đổi type để Discord vẫn cập nhật UI (nút đỏ)
        interceptor = (e: any) => {
            if (e && e.type === "AUDIO_TOGGLE_SELF_DEAF") {
                const config = getConfigModule();
                if (!config) return;

                if (!isFakeDeafened) {
                    // Bật fake deafen: lưu volume, set về 0
                    previousOutputVolume = config.getOutputVolume?.() ?? 100;
                    previousInputVolume = config.getInputVolume?.() ?? 100;

                    // setTimeout để âm lượng được đổi sau khi Discord đã xử lý xong event gốc
                    setTimeout(() => {
                        FluxDispatcher.dispatch({ type: "AUDIO_SET_OUTPUT_VOLUME", volume: 0 });
                        FluxDispatcher.dispatch({ type: "AUDIO_SET_INPUT_VOLUME", volume: 0 });
                    }, 50);

                    isFakeDeafened = true;
                    Toasts.show(Toasts.create("Bật Fake Deafen", Toasts.Types.SUCCESS));
                } else {
                    // Tắt fake deafen: khôi phục volume
                    setTimeout(() => {
                        FluxDispatcher.dispatch({ type: "AUDIO_SET_OUTPUT_VOLUME", volume: previousOutputVolume ?? 100 });
                        FluxDispatcher.dispatch({ type: "AUDIO_SET_INPUT_VOLUME", volume: previousInputVolume ?? 100 });
                        previousOutputVolume = null;
                        previousInputVolume = null;
                    }, 50);

                    isFakeDeafened = false;
                    Toasts.show(Toasts.create("Tắt Fake Deafen", Toasts.Types.NORMAL));
                }
            }
        };

        FluxDispatcher.addInterceptor(interceptor);
    },

    stop() {
        if (originalWsSend) {
            window.WebSocket.prototype.send = originalWsSend;
            originalWsSend = null;
        }

        if (interceptor) {
            const index = FluxDispatcher._interceptors?.indexOf(interceptor);
            if (index !== undefined && index > -1) {
                FluxDispatcher._interceptors.splice(index, 1);
            }
            interceptor = null;
        }

        if (isFakeDeafened && previousOutputVolume !== null && previousInputVolume !== null) {
            FluxDispatcher.dispatch({ type: "AUDIO_SET_OUTPUT_VOLUME", volume: previousOutputVolume });
            FluxDispatcher.dispatch({ type: "AUDIO_SET_INPUT_VOLUME", volume: previousInputVolume });
            isFakeDeafened = false;
        }
    }
});
