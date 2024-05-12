/**
 * @name JJPlugin
 * @version 0.0.7
 * @description Increases microphone input volume by about 300%. 
 * @authorLink https://github.com/jjbendbloxks
 * @website https://jjbendbloxks.github.io/
 * @source https://github.com/jjbendbloxks/jj
 * @updateUrl https://github.com/JJ/JJPlugin/blob/main/JJPlugin.plugin.js
 */
module.exports = (() => {
  const config = {
    // configuration object for the plugin
    main: "index.js",
    info: {
      name: "JJPlugin",
      authors: [{ name: "JJ", discord_id: "736839685317591081" }],
      version: "0.0.7",
      description: "Increases microphone input volume by about 300%. Better Discord v1.9.5",
    },
    changelog: [
      {
        title: "Changelog",
        items: ["Increased microphone input volume"]
      }
    ],
    defaultConfig: [
      // default configuration options for the plugin
      {
        type: "switch",
        id: "enableToasts",
        name: "Enable notifications",
        note: "Warning for Discord Audio Features",
        value: true,
      }
    ],
  };

  return !global.ZeresPluginLibrary
    ? class {
        // placeholder for when zerespluginlibrary is missing
        constructor() {
          this._config = config;
        }
        getName() {
          return config.info.name;
        }
        getAuthor() {
          return config.info.authors.map((a) => a.name).join(", ");
        }
        getDescription() {
          return config.info.description;
        }
        getVersion() {
          return config.info.version;
        }
        load() {
          // show modal to install zerespluginlibrary
          BdApi.showConfirmationModal(
            "[JJPlugin] Library Missing",
            `ZeresPluginLibrary is missing. Click "Install Now" to download it.`,
            {
              confirmText: "Install Now",
              cancelText: "Cancel",
              onConfirm: () => {
                require("request").get(
                  "https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
                  async (error, response, body) => {
                    if (error) {
                      console.error("Error downloading ZeresPluginLibrary:", error);
                      BdApi.showConfirmationModal(
                        "Download Error",
                        "An error occurred while downloading ZeresPluginLibrary. Please try again later or download it manually from the official website.",
                        {
                          confirmText: "OK",
                          cancelText: "Cancel",
                        }
                      );
                      return;
                    }
                    await new Promise((r) =>
                      require("fs").writeFile(
                        require("path").join(
                          BdApi.Plugins.folder,
                          "0PluginLibrary.plugin.js"
                        ),
                        body,
                        r
                      )
                    );
                  }
                );
              },
            }
          );
        }
        start() {}
        stop() {}
      }
    : (([Plugin, Api]) => {
        // actual plugin implementation when zerespluginlibrary is available
        const plugin = (Plugin, Library) => {
          const { WebpackModules, Patcher, Toasts } = Library;
          return class JJPlugin extends Plugin {
            onStart() {
              BdApi.UI.showNotice("[JJPlugin v.0.0.7] You can now use JJPlugin! 😉", { type: "info", timeout: 5000 });
              this.settingsWarning();
              this.volumeIncreaseEnabled = true;

              // Hook into Discord's audio input
              this.patchMicrophone();
            }

            onStop() {
              Patcher.unpatchAll();
            }

            patchMicrophone() {
              const voiceModule = WebpackModules.getModule(BdApi.Webpack.Filters.byPrototypeFields("getMicData"));
              this.unpatch = Patcher.after("JJPlugin", voiceModule.prototype, "getMicData", (_this, _args, ret) => {
                if (this.volumeIncreaseEnabled) {
                  const increasedVolumeData = this.increaseVolume(ret);
                  return increasedVolumeData;
                }
                return ret;
              });
            }

            increaseVolume(inputData) {
              const increasedVolumeData = inputData.map(val => val * 3); // Increase volume by 300%
              return increasedVolumeData;
            }

            settingsWarning() {
              const voiceSettingsStore = WebpackModules.getByProps(
                "getEchoCancellation"
              );
              if (
                voiceSettingsStore.getNoiseSuppression() ||
                voiceSettingsStore.getNoiseCancellation() ||
                voiceSettingsStore.getEchoCancellation()
              ) {
                if (this.settings.enableToasts) {
                  // show a toast notification for user
                  Toasts.show(
                    "Please disable echo cancellation, noise reduction, and noise suppression for JJPlugin",
                    { type: "warning", timeout: 5000 }
                  );
                }
                return true;
              } else return false;
            }
          };
        };
        return plugin(Plugin, Api);
      })(global.ZeresPluginLibrary.buildPlugin(config));
})();
