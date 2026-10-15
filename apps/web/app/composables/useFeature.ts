// Features that are built but not launched. Each is off unless switched on in
// the runtime config, so a preview can turn one on without a rebuild:
// NUXT_PUBLIC_FEATURES_BUILDER=true shows the datachain builder.
export type FeatureName = keyof ReturnType<typeof useRuntimeConfig>['public']['features']

export const useFeature = (name: FeatureName) => !!useRuntimeConfig().public.features[name]
