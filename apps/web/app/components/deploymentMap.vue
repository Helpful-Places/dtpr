<script setup lang="ts">
    import { Map as MapLibreMap, NavigationControl, AttributionControl, LngLatBounds, Popup, setWorkerUrl } from 'maplibre-gl'
    import type { MapLayerMouseEvent } from 'maplibre-gl'
    // MapLibre looks for its worker next to its own file, which no longer holds
    // once Vite has bundled it, so the bundled worker's URL is passed explicitly.
    import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
    import 'maplibre-gl/dist/maplibre-gl.css'

    type Deployment = {
        id: string,
        name: string,
        city: string,
        country: string,
        mapLabel?: string,
        flag?: string,
        url?: string,
        logoPath?: string,
        latitude: number,
        longitude: number
    }

    const props = withDefaults(defineProps<{
        deployments: Deployment[],
        // The deployment to fly to and highlight, when a list beside the map drives it
        selectedId?: string | null,
        popups?: boolean
    }>(), {
        selectedId: null,
        popups: true
    })

    const emit = defineEmits<{ select: [id: string] }>()

    // MakeShift Navy (--color-primary-700); MapLibre paint values can't read CSS variables.
    const MARKER_COLOR = '#1B2B80'

    const container = ref<HTMLElement | null>(null)
    const mapError = ref(false)
    let map: MapLibreMap | undefined
    let loaded = false

    function fitAll(animate: boolean) {
        if (!map || props.deployments.length < 2) return
        const bounds = new LngLatBounds()
        for (const d of props.deployments) {
            bounds.extend([d.longitude, d.latitude])
        }
        map.fitBounds(bounds, { padding: 60, maxZoom: 5, animate })
    }

    function showSelected() {
        if (!map || !loaded) return
        const id = props.selectedId ?? ''
        map.setPaintProperty('deployment-dots', 'circle-radius', ['case', ['==', ['get', 'id'], id], 9, 5])
        map.setPaintProperty('deployment-dots', 'circle-stroke-width', ['case', ['==', ['get', 'id'], id], 3, 1.5])

        const selected = props.deployments.find(d => d.id === id)
        if (selected) {
            map.flyTo({ center: [selected.longitude, selected.latitude], zoom: 5, essential: false })
        }
    }

    watch(() => props.selectedId, showSelected)

    defineExpose({ resetView: () => fitAll(true) })

    const geojson = computed(() => ({
        type: 'FeatureCollection' as const,
        features: props.deployments.map(d => ({
            type: 'Feature' as const,
            geometry: {
                type: 'Point' as const,
                coordinates: [d.longitude, d.latitude]
            },
            properties: {
                id: d.id,
                name: d.name,
                city: d.city,
                country: d.country,
                url: d.url,
                logoPath: d.logoPath,
                flag: d.flag,
                mapLabel: d.mapLabel
            }
        }))
    }))

    // Built from DOM nodes rather than an HTML string, so content edited in
    // Studio can never inject markup into the popup.
    function popupContent(p: Record<string, string | null>) {
        const root = document.createElement('div')
        root.className = 'min-w-52 font-sans'

        const top = document.createElement('div')
        top.className = 'flex items-start gap-2.5 p-3'

        if (p.logoPath) {
            const img = document.createElement('img')
            img.src = p.logoPath
            img.alt = ''
            img.className = 'size-12 shrink-0 rounded bg-white object-contain p-1'
            top.append(img)
        }

        const text = document.createElement('div')
        text.className = 'min-w-0'
        const name = document.createElement('strong')
        name.className = 'block text-sm leading-tight text-highlighted'
        name.textContent = p.name
        text.append(name)

        const location = [p.city, p.country].filter(Boolean).join(', ')
        if (location) {
            const loc = document.createElement('p')
            loc.className = 'mt-1 text-xs text-muted'
            loc.textContent = [p.flag, location].filter(Boolean).join(' ')
            text.append(loc)
        }
        top.append(text)
        root.append(top)

        if (p.url) {
            const link = document.createElement('a')
            link.href = p.url
            link.target = '_blank'
            link.rel = 'noopener noreferrer'
            link.className = 'block border-t border-default px-3 py-2 text-xs font-medium text-primary hover:bg-accented'
            link.textContent = 'See DTPR Deployment'
            root.append(link)
        }

        return root
    }

    onMounted(() => {
        if (!container.value) return

        try {
            setWorkerUrl(workerUrl)
            map = new MapLibreMap({
                container: container.value,
                style: 'https://api.maptiler.com/maps/basic-v2/style.json?key=8MWdTlLX3Eps5Bjn7sdV',
                center: [0, 20],
                zoom: 1.5,
                pitchWithRotate: false,
                dragRotate: false,
                // Leave page scrolling alone until the visitor engages with the map.
                cooperativeGestures: true,
                attributionControl: false
            })
        } catch {
            mapError.value = true
            return
        }

        const m = map
        m.addControl(new NavigationControl({ showCompass: false }), 'top-right')
        m.addControl(new AttributionControl({ compact: true }), 'bottom-left')

        m.on('load', () => {
            // Hide the base map's own place names so only deployments are labelled
            for (const layer of m.getStyle().layers) {
                if (layer.type === 'symbol' && layer.layout?.['text-field']) {
                    m.setLayoutProperty(layer.id, 'visibility', 'none')
                }
            }

            // A solid tile, stretched behind each label as its background
            const bgSize = 24
            const bgData = new Uint8Array(bgSize * bgSize * 4)
            const [r, g, b] = [1, 3, 5].map(i => parseInt(MARKER_COLOR.slice(i, i + 2), 16))
            for (let i = 0; i < bgSize * bgSize; i++) {
                bgData.set([r!, g!, b!, 235], i * 4)
            }
            m.addImage('label-bg', { width: bgSize, height: bgSize, data: bgData }, {
                sdf: false,
                pixelRatio: 1,
                stretchX: [[8, 16]],
                stretchY: [[8, 16]],
                content: [0, 0, 24, 24]
            })

            m.addSource('deployments', { type: 'geojson', data: geojson.value })

            // Dots always render, so a deployment stays visible when its label is hidden by collision
            m.addLayer({
                id: 'deployment-dots',
                type: 'circle',
                source: 'deployments',
                paint: {
                    'circle-radius': 5,
                    'circle-color': MARKER_COLOR,
                    'circle-stroke-width': 1.5,
                    'circle-stroke-color': '#ffffff'
                }
            })

            m.addLayer({
                id: 'deployment-labels',
                type: 'symbol',
                source: 'deployments',
                layout: {
                    'text-field': ['coalesce', ['get', 'mapLabel'], ['get', 'city']],
                    'text-font': ['Open Sans Semibold'],
                    'text-size': 14,
                    'text-anchor': 'center',
                    'text-variable-anchor': ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
                    'text-radial-offset': 1.2,
                    'text-justify': 'auto',
                    'icon-image': 'label-bg',
                    'icon-text-fit': 'both',
                    'icon-text-fit-padding': [4, 8, 4, 8]
                },
                paint: {
                    'text-color': '#ffffff'
                }
            })

            loaded = true
            fitAll(false)
            showSelected()

            function showPopup(e: MapLayerMouseEvent) {
                const feature = e.features?.[0]
                if (!feature || feature.geometry.type !== 'Point') return

                emit('select', feature.properties.id)
                if (!props.popups) return

                // MapLibre stringifies properties; normalise nulls
                const p: Record<string, string | null> = { ...feature.properties }
                for (const key of Object.keys(p)) {
                    if (p[key] === 'null') p[key] = null
                }

                new Popup({ offset: 10, maxWidth: '260px', className: 'deployment-popup' })
                    .setLngLat(feature.geometry.coordinates as [number, number])
                    .setDOMContent(popupContent(p))
                    .addTo(m)
            }

            for (const layerId of ['deployment-labels', 'deployment-dots']) {
                m.on('click', layerId, showPopup)
                m.on('mouseenter', layerId, () => { m.getCanvas().style.cursor = 'pointer' })
                m.on('mouseleave', layerId, () => { m.getCanvas().style.cursor = '' })
            }
        })
    })

    onBeforeUnmount(() => map?.remove())
</script>

<template>
    <div v-if="mapError" class="flex size-full items-center justify-center bg-accented text-sm text-muted">
        Map could not be loaded on this device.
    </div>
    <div v-else ref="container" class="size-full" role="region" aria-label="Map of DTPR deployments around the world"/>
</template>

<style>
.deployment-popup .maplibregl-popup-content {
  padding: 0;
  border-radius: var(--ui-radius);
  overflow: hidden;
  background: var(--ui-bg-elevated);
}
</style>
