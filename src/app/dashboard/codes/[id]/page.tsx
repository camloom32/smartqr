'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

const DEVICE_COLORS: Record<string, string> = {
  ios: '#3b82f6',
  android: '#22c55e',
  desktop: '#6b7280',
  tablet: '#f59e0b',
  other: '#9ca3af',
}

const WORLD_MAP_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

type TimelinePoint = { date: string; scans: number }
type DevicePoint = { name: string; value: number; label: string }
type LocationPoint = { city: string; country: string; count: number }
type ReferrerPoint = { source: string; count: number }
type ScanLocation = { country: string; city: string; count: number }

type AnalyticsData = {
  timeline: TimelinePoint[]
  deviceBreakdown: DevicePoint[]
  topLocations: LocationPoint[]
  topReferrers: ReferrerPoint[]
  scanLocations: ScanLocation[]
  totalScans: number
}

const CITY_COORDS: Record<string, [number, number]> = {
  'New York': [40.7128, -74.006],
  'Los Angeles': [34.0522, -118.2437],
  'London': [51.5074, -0.1278],
  'Paris': [48.8566, 2.3522],
  'Tokyo': [35.6762, 139.6503],
  'Sydney': [-33.8688, 151.2093],
  'Berlin': [52.52, 13.405],
  'Toronto': [43.6532, -79.3832],
  'Chicago': [41.8781, -87.6298],
  'San Francisco': [37.7749, -122.4194],
  'Seattle': [47.6062, -122.3321],
  'Austin': [30.2672, -97.7431],
  'Boston': [42.3601, -71.0589],
  'Miami': [25.7617, -80.1918],
  'Denver': [39.7392, -104.9903],
  'Vancouver': [49.2827, -123.1207],
  'Singapore': [1.3521, 103.8198],
  'Hong Kong': [22.3193, 114.1694],
  'Mumbai': [19.076, 72.8777],
  'Dubai': [25.2048, 55.2708],
  'São Paulo': [-23.5505, -46.6333],
  'Mexico City': [19.4326, -99.1332],
  'Amsterdam': [52.3676, 4.9041],
  'Stockholm': [59.3293, 18.0686],
  'Warsaw': [52.2297, 21.0122],
  'Moscow': [55.7558, 37.6173],
  'Istanbul': [41.0082, 28.9784],
  'Cairo': [30.0444, 31.2357],
  'Lagos': [6.5244, 3.3792],
  'Nairobi': [-1.2921, 36.8219],
  'Jakarta': [-6.2088, 106.8456],
  'Bangkok': [13.7563, 100.5018],
  'Manila': [14.5995, 120.9842],
  'Seoul': [37.5665, 126.978],
  'Beijing': [39.9042, 116.4074],
  'Shanghai': [31.2304, 121.4737],
  'Delhi': [28.7041, 77.1025],
  'Bangalore': [12.9716, 77.5946],
  'Unknown': [20, 0],
}

function GeoMap({ locations }: { locations: ScanLocation[] }) {
  const [geoData, setGeoData] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    fetch(WORLD_MAP_URL)
      .then(r => r.json())
      .then(data => setGeoData(data))
      .catch(() => {})
  }, [mounted])

  if (!mounted || !geoData) {
    return (
      <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading map...</p>
      </div>
    )
  }

  const locationCoords = locations.map(loc => {
    const coords = CITY_COORDS[loc.city] || CITY_COORDS[loc.country] || CITY_COORDS['Unknown']
    return { ...loc, coords }
  })

  const totalCount = locationCoords.reduce((s, l) => s + l.count, 0)

  return (
    <div className="relative h-64 bg-blue-50 rounded-xl overflow-hidden">
      <svg viewBox="0 0 800 400" className="w-full h-full">
        <rect width="800" height="400" fill="#eff6ff" />
        <path
          d="M617.5,290.5L619.5,289L620.5,290.5L621.5,290L621.5,291.5L623.5,291.5L623.5,293.5L625.5,293.5L626.5,294.5L627.5,293.5L630.5,294.5L631.5,295.5L632.5,295.5L632.5,296.5L634.5,297.5L636.5,297.5L637.5,298.5L639.5,298.5L641.5,298L642.5,299.5L644.5,299.5L645.5,300.5L647.5,301.5L649.5,302.5L650.5,302.5L652.5,303.5L653.5,303.5L655.5,304.5L657.5,305.5L658.5,306.5L660.5,306.5L661.5,307.5L663.5,308.5L665.5,308.5L666.5,309.5L667.5,310.5L669.5,311.5L670.5,312.5L672.5,312.5L674.5,313.5L675.5,314.5L677.5,315.5L678.5,315.5L680.5,316.5L681.5,317.5L683.5,318.5L685.5,318.5L686.5,319.5L688.5,320.5L689.5,321.5L691.5,321.5L692.5,322.5L694.5,323.5L695.5,324.5L697.5,325.5L699.5,325.5L700.5,326.5L701.5,327.5L702.5,328.5L704.5,328.5L705.5,329.5L706.5,330.5L707.5,331.5L708.5,332.5L710.5,333.5L711.5,334.5L712.5,335.5L714.5,336.5L715.5,337.5L716.5,338.5L717.5,338.5L718.5,339.5L719.5,340.5L721.5,342.5L722.5,343.5L723.5,344.5L724.5,344.5L726.5,346.5L727.5,347.5L728.5,348.5L730.5,349.5L731.5,350.5L732.5,351.5L733.5,352.5L734.5,352.5L735.5,353.5L736.5,354.5L737.5,355.5L738.5,356.5L739.5,357.5L740.5,358.5L741.5,359.5L742.5,360.5L743.5,361.5L745.5,362.5L746.5,363.5L747.5,364.5L748.5,365.5L749.5,366.5L750.5,367.5L751.5,368.5L752.5,369.5L753.5,370.5L754.5,371.5L755.5,372.5L756.5,373.5L757.5,374.5L758.5,375.5L759.5,376.5L760.5,377.5L761.5,378.5L762.5,379.5L763.5,380.5L764.5,381.5L765.5,382.5L766.5,383.5L767.5,384.5L768.5,385.5L769.5,386.5L770.5,387.5L771.5,388.5L772.5,389.5L773.5,389.5L774.5,390.5L775.5,391.5L776.5,392.5L777.5,392.5L778.5,393.5L779.5,394.5L781.5,394.5L782.5,395.5L783.5,396.5L784.5,397.5L785.5,398.5L786.5,398.5L787.5,399.5L788.5,399.5L789.5,400.5L790.5,401.5L791.5,402.5L792.5,402.5L793.5,403.5L794.5,404.5L795.5,404.5L796.5,405.5L797.5,406.5L798.5,406.5L799.5,407.5L800.5,407.5L799.5,407.5L800.5,408.5ZM287.5,337.5L288.5,338.5L289.5,337.5L290.5,338.5L291.5,337.5L292.5,337.5L292.5,336.5L293.5,336.5L293.5,337.5L294.5,338.5L295.5,339.5L297.5,340.5L298.5,339.5L299.5,339.5L300.5,338.5L301.5,338.5L301.5,339.5L302.5,339.5L302.5,341.5L303.5,342.5L303.5,343.5L304.5,344.5L304.5,346.5L305.5,346.5L306.5,346.5L306.5,347.5L307.5,348.5L307.5,350.5L308.5,350.5L309.5,350.5L309.5,351.5L310.5,352.5L310.5,353.5L311.5,354.5L311.5,355.5L312.5,355.5L312.5,356.5L313.5,356.5L313.5,357.5L314.5,357.5L314.5,358.5L315.5,358.5L315.5,359.5L316.5,360.5L317.5,361.5L317.5,362.5L318.5,362.5L318.5,363.5L319.5,363.5L319.5,364.5L320.5,364.5L320.5,365.5L321.5,366.5L321.5,367.5L322.5,368.5L323.5,369.5L324.5,369.5L324.5,370.5L325.5,371.5L326.5,371.5L326.5,372.5L327.5,372.5L327.5,373.5L328.5,373.5L328.5,374.5L329.5,375.5L329.5,376.5L330.5,376.5L330.5,377.5L331.5,377.5L331.5,378.5L332.5,378.5L332.5,379.5L333.5,379.5L333.5,380.5L334.5,380.5L334.5,381.5L335.5,381.5L335.5,382.5L336.5,382.5L336.5,383.5L337.5,383.5L337.5,384.5L338.5,384.5L338.5,385.5L339.5,386.5L340.5,386.5L340.5,387.5L341.5,387.5L341.5,388.5L342.5,388.5L342.5,389.5L343.5,390.5L343.5,391.5L344.5,391.5L344.5,392.5L345.5,392.5L345.5,393.5L346.5,394.5L346.5,395.5L347.5,395.5L347.5,396.5L348.5,396.5L348.5,397.5L349.5,398.5L349.5,399.5L350.5,399.5L350.5,400.5L351.5,401.5L352.5,401.5L352.5,402.5L353.5,402.5L354.5,403.5L355.5,403.5L355.5,404.5L356.5,404.5L356.5,405.5L357.5,405.5L358.5,406.5L359.5,406.5L359.5,407.5L360.5,407.5L360.5,408.5L361.5,408.5L361.5,409.5L362.5,409.5L363.5,410.5L363.5,411.5L364.5,412.5L365.5,413.5L366.5,413.5L366.5,414.5L367.5,414.5L368.5,415.5L369.5,415.5L369.5,416.5L370.5,416.5L371.5,417.5L372.5,417.5L372.5,418.5L373.5,418.5L373.5,419.5L374.5,419.5L374.5,420.5L375.5,421.5L376.5,422.5L377.5,422.5L377.5,423.5L378.5,423.5L379.5,424.5L379.5,425.5L380.5,425.5L381.5,426.5L382.5,426.5L382.5,427.5L383.5,427.5L384.5,428.5L385.5,428.5L385.5,429.5L386.5,430.5L387.5,430.5L387.5,431.5L388.5,431.5L389.5,432.5L390.5,433.5L391.5,433.5L391.5,434.5L392.5,435.5L393.5,435.5L393.5,436.5L394.5,436.5L395.5,437.5L396.5,437.5L396.5,438.5L397.5,438.5L398.5,439.5L399.5,439.5L400.5,440.5L401.5,441.5L402.5,441.5L402.5,442.5L403.5,443.5L405.5,444.5L406.5,444.5L406.5,445.5L407.5,445.5L408.5,446.5L409.5,447.5L410.5,448.5L411.5,448.5L411.5,449.5L412.5,450.5L413.5,451.5L414.5,452.5L415.5,453.5L416.5,454.5L417.5,454.5L417.5,455.5L418.5,455.5L418.5,456.5L419.5,456.5L419.5,457.5L420.5,457.5L420.5,458.5L421.5,458.5L421.5,459.5L422.5,459.5L422.5,460.5L423.5,461.5L424.5,461.5L424.5,462.5L425.5,463.5L426.5,463.5L426.5,464.5L427.5,464.5L428.5,465.5L429.5,465.5L429.5,466.5L430.5,467.5L431.5,467.5L431.5,468.5L432.5,468.5L433.5,469.5L434.5,469.5L434.5,470.5L435.5,471.5L437.5,471.5L437.5,472.5L438.5,473.5L439.5,473.5L439.5,474.5L440.5,474.5L440.5,475.5L441.5,475.5L441.5,476.5L442.5,476.5L442.5,477.5L443.5,477.5L443.5,478.5L444.5,478.5L444.5,479.5L445.5,479.5L445.5,480.5L446.5,480.5L446.5,481.5L447.5,481.5L447.5,482.5L448.5,482.5L448.5,483.5L449.5,483.5L449.5,484.5L450.5,484.5L450.5,485.5L451.5,485.5L451.5,486.5L452.5,487.5L453.5,487.5L453.5,488.5L454.5,488.5L454.5,489.5L455.5,489.5L455.5,490.5L456.5,491.5L457.5,491.5L457.5,492.5L458.5,492.5L459.5,493.5L460.5,493.5L460.5,494.5L461.5,494.5L462.5,495.5L463.5,495.5L463.5,496.5L464.5,496.5L465.5,496.5L465.5,497.5L466.5,497.5L467.5,498.5L468.5,498.5L468.5,499.5L469.5,499.5L470.5,499.5L471.5,500.5L472.5,500.5L472.5,501.5L473.5,501.5L474.5,501.5L474.5,502.5L475.5,502.5L476.5,502.5L476.5,503.5L477.5,503.5L477.5,504.5L478.5,504.5L479.5,505.5L480.5,505.5L481.5,506.5L482.5,506.5L482.5,507.5L483.5,507.5L484.5,508.5L485.5,508.5L485.5,509.5L486.5,509.5L487.5,510.5L488.5,510.5L489.5,511.5L490.5,511.5L490.5,512.5L491.5,512.5L492.5,512.5L493.5,513.5L494.5,513.5L494.5,514.5L495.5,514.5L496.5,515.5L497.5,515.5L497.5,516.5L498.5,516.5L499.5,516.5L500.5,517.5L501.5,518.5L502.5,518.5L502.5,519.5L503.5,519.5L504.5,520.5L505.5,520.5L506.5,521.5L507.5,521.5L507.5,522.5L508.5,522.5L509.5,523.5L510.5,523.5L510.5,524.5L511.5,524.5L512.5,524.5L513.5,525.5L514.5,525.5L515.5,526.5L516.5,526.5L516.5,527.5L517.5,527.5L518.5,527.5L518.5,528.5L519.5,528.5L520.5,528.5L520.5,529.5L521.5,529.5L522.5,529.5L523.5,530.5L524.5,530.5L524.5,531.5L525.5,531.5L526.5,531.5L526.5,532.5L527.5,532.5L528.5,532.5L528.5,533.5L529.5,533.5L530.5,534.5L531.5,534.5L532.5,534.5L532.5,535.5L533.5,535.5L534.5,536.5L535.5,536.5L536.5,537.5L537.5,537.5L538.5,538.5L539.5,538.5L539.5,539.5L540.5,539.5L541.5,540.5L542.5,541.5L543.5,541.5L544.5,542.5L545.5,542.5L545.5,543.5L546.5,543.5L547.5,544.5L548.5,545.5L549.5,545.5L549.5,546.5L550.5,546.5L551.5,547.5L552.5,547.5L553.5,548.5L554.5,549.5L555.5,549.5L556.5,550.5L557.5,550.5L558.5,551.5L559.5,551.5L560.5,552.5L561.5,552.5L562.5,553.5L563.5,553.5L563.5,554.5L564.5,554.5L565.5,555.5L566.5,555.5L567.5,556.5L568.5,556.5L569.5,557.5L570.5,558.5L571.5,558.5L571.5,559.5L572.5,559.5L573.5,560.5L574.5,560.5L575.5,561.5L576.5,561.5L576.5,562.5L577.5,562.5L578.5,562.5L579.5,563.5L580.5,563.5L580.5,564.5L581.5,564.5L582.5,564.5L583.5,565.5L584.5,565.5L584.5,566.5L585.5,566.5L586.5,566.5L587.5,567.5L588.5,567.5L589.5,568.5L590.5,568.5L590.5,569.5L591.5,569.5L592.5,569.5L593.5,570.5L594.5,570.5L595.5,571.5L596.5,571.5L596.5,572.5L597.5,572.5L598.5,573.5L599.5,573.5L599.5,574.5L600.5,574.5L601.5,574.5L602.5,575.5L603.5,575.5L604.5,576.5L605.5,576.5L605.5,577.5L606.5,577.5L607.5,577.5L608.5,578.5L609.5,578.5L610.5,578.5L611.5,579.5L612.5,579.5L612.5,580.5L613.5,580.5L614.5,580.5L615.5,581.5L616.5,581.5L617.5,582.5L618.5,582.5L619.5,583.5L620.5,583.5L621.5,584.5L622.5,584.5L622.5,585.5L623.5,585.5L624.5,585.5L625.5,586.5L626.5,586.5L627.5,587.5L628.5,587.5L629.5,587.5L630.5,588.5L631.5,588.5L632.5,588.5L633.5,589.5L634.5,589.5L635.5,589.5L636.5,590.5L637.5,590.5L637.5,591.5L638.5,591.5L639.5,591.5L640.5,592.5L641.5,592.5L642.5,592.5L643.5,593.5L644.5,593.5L645.5,594.5L646.5,594.5L647.5,594.5L648.5,595.5L649.5,595.5L649.5,596.5L650.5,596.5L651.5,596.5L652.5,597.5L653.5,597.5L654.5,597.5L655.5,597.5L656.5,598.5L657.5,598.5L658.5,599.5L659.5,599.5L659.5,600.5L660.5,600.5L661.5,601.5L662.5,601.5L663.5,601.5L664.5,602.5L665.5,602.5L666.5,603.5L667.5,603.5L667.5,604.5L668.5,604.5L669.5,604.5L670.5,605.5L671.5,605.5L672.5,605.5L673.5,606.5L674.5,606.5L675.5,606.5L676.5,607.5L677.5,607.5L678.5,607.5L679.5,608.5L680.5,608.5L681.5,608.5L682.5,609.5L683.5,609.5L683.5,610.5L684.5,610.5L685.5,610.5L686.5,611.5L687.5,611.5L688.5,611.5L689.5,612.5L690.5,612.5L691.5,612.5L692.5,613.5L693.5,613.5L693.5,614.5L694.5,614.5L695.5,614.5L696.5,615.5L697.5,615.5L698.5,615.5L699.5,616.5L700.5,616.5L701.5,616.5L702.5,617.5L703.5,617.5L703.5,618.5L704.5,618.5L705.5,618.5L706.5,619.5L707.5,619.5L708.5,619.5L709.5,620.5L710.5,620.5L711.5,620.5L712.5,621.5L713.5,621.5L713.5,622.5L714.5,622.5L715.5,622.5L716.5,623.5L717.5,623.5L718.5,624.5L719.5,624.5L719.5,625.5L720.5,625.5L721.5,625.5L722.5,626.5L723.5,626.5L723.5,627.5L724.5,627.5L725.5,627.5L726.5,628.5L727.5,628.5L727.5,629.5L728.5,629.5L729.5,629.5L730.5,630.5L731.5,630.5L731.5,631.5L732.5,631.5L733.5,631.5L734.5,632.5L735.5,632.5L735.5,633.5L736.5,633.5L737.5,633.5L738.5,634.5L739.5,634.5L739.5,635.5L740.5,635.5L741.5,635.5L742.5,636.5L743.5,636.5L743.5,637.5L744.5,637.5L745.5,637.5L746.5,638.5L747.5,638.5L747.5,639.5L748.5,639.5L749.5,639.5L750.5,640.5L751.5,640.5L751.5,641.5L752.5,641.5L753.5,641.5L754.5,642.5L755.5,642.5L755.5,643.5L756.5,643.5L757.5,643.5L758.5,644.5L759.5,644.5L759.5,645.5L760.5,645.5L761.5,645.5L762.5,646.5L763.5,646.5L763.5,647.5L764.5,647.5L765.5,647.5L766.5,648.5L767.5,648.5L767.5,649.5L768.5,649.5L769.5,649.5L770.5,650.5L771.5,650.5L771.5,651.5L772.5,651.5L773.5,651.5L774.5,652.5L775.5,652.5L775.5,653.5L776.5,653.5L777.5,653.5L778.5,654.5L779.5,654.5L779.5,655.5L780.5,655.5L781.5,655.5L782.5,656.5L783.5,656.5L783.5,657.5L784.5,657.5L785.5,657.5L786.5,658.5L787.5,658.5L787.5,659.5L788.5,659.5L789.5,659.5L790.5,660.5L791.5,660.5L791.5,661.5L792.5,661.5L793.5,661.5L794.5,662.5L795.5,662.5L795.5,663.5L796.5,663.5L797.5,663.5L798.5,664.5L799.5,664.5L799.5,665.5L800.5,665.5L799.5,665.5L800.5,666.5Z"
          fill="#93c5fd"
          stroke="#1e40af"
          strokeWidth="0.5"
          opacity="0.8"
        />
        {locationCoords.slice(0, 50).map((loc, i) => {
          const x = ((loc.coords[1] + 180) / 360) * 800
          const y = ((90 - loc.coords[0]) / 180) * 400
          const r = Math.max(4, Math.min(16, Math.sqrt(loc.count / totalCount) * 40))
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={r}
              fill="#2563eb"
              fillOpacity={0.5 + (loc.count / Math.max(...locationCoords.map(l => l.count))) * 0.5}
              stroke="#1e40af"
              strokeWidth="1"
            />
          )
        })}
      </svg>
      <div className="absolute bottom-2 right-2 text-xs text-blue-800 bg-blue-100 bg-opacity-80 px-2 py-1 rounded">
        {locations.length > 0 ? `${locations.length} locations tracked` : 'No location data yet'}
      </div>
    </div>
  )
}

export default function CodeDetailPage() {
  const params = useParams()
  const codeId = params.id as string

  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [recentScans, setRecentScans] = useState<any[]>([])
  const [qrImage, setQrImage] = useState('')
  const [copied, setCopied] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'scans' | 'geo'>('overview')

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }

      const { data: codeData } = await supabase
        .from('dynamic_codes')
        .select('*')
        .eq('id', codeId)
        .eq('user_id', session.user.id)
        .single()

      if (!codeData) {
        window.location.href = '/dashboard'
        return
      }

      setCode(codeData)

      const style = codeData.style_json || {}

      const [summaryResult, scansResult, analyticsRes] = await Promise.all([
        supabase.rpc('get_scan_summary', { code_id_param: codeId }),
        supabase.from('scan_events').select('*').eq('code_id', codeId).order('created_at', { ascending: false }).limit(20),
        fetch(`/api/codes/${codeId}/analytics`).then(r => r.json()).catch(() => null),
      ])

      if (summaryResult.data) {
        setStats(summaryResult.data[0])
      } else {
        setStats({ total_scans: 0, unique_visitors: 0, today_scans: 0, this_week: 0, this_month: 0 })
      }

      setRecentScans(scansResult.data || [])
      setAnalytics(analyticsRes)

      const qrRes = await fetch('/api/qr/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `https://smartqr.id/c/${codeData.short_code}`,
          fg: style.foregroundColor || '#000000',
          bg: style.backgroundColor || '#ffffff',
          logo: style.logo || null,
        }),
      })
      const qrData = await qrRes.json()
      setQrImage(qrData.png || '')
      setLoading(false)
    }

    fetchData()
  }, [codeId])

  const copyUrl = async () => {
    await navigator.clipboard.writeText(`https://smartqr.id/c/${code?.short_code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const exportData = async (format: 'csv' | 'json') => {
    window.location.href = `/api/codes/${codeId}/export?format=${format}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!code) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Code not found</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">Back to dashboard</Link>
      </div>
    )
  }

  const timeline = analytics?.timeline || []
  const timelineLabels = timeline.map(p => {
    const d = new Date(p.date)
    return `${d.getMonth() + 1}/${d.getDate()}`
  })

  const deviceColors = (device: string) => {
    const d = device.toLowerCase()
    if (d.includes('ios') || d.includes('iphone') || d.includes('ipad')) return DEVICE_COLORS.ios
    if (d.includes('android')) return DEVICE_COLORS.android
    if (d.includes('tablet')) return DEVICE_COLORS.tablet
    if (d.includes('desktop')) return DEVICE_COLORS.desktop
    return DEVICE_COLORS.other
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to dashboard
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{code.title || 'QR Code Details'}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => exportData('csv')}
              className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            >
              Export CSV
            </button>
            <button
              onClick={() => exportData('json')}
              className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            >
              Export JSON
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 border-b">
          {(['overview', 'scans', 'geo'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' ? 'Overview' : tab === 'scans' ? 'All Scans' : 'World Map'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Scan Timeline</h2>
              {timeline.length === 0 || timeline.every(t => t.scans === 0) ? (
                <p className="text-gray-400 text-center py-8">No scan data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={timeline} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      ticks={[timeline[0]?.date, timeline[Math.floor(timeline.length / 2)]?.date, timeline[timeline.length - 1]?.date]}
                      tickFormatter={v => {
                        const d = new Date(v)
                        return `${d.getMonth() + 1}/${d.getDate()}`
                      }}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <Tooltip
                      labelFormatter={v => new Date(v as string).toLocaleDateString()}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                    />
                    <Bar dataKey="scans" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Device Breakdown</h2>
              {analytics?.deviceBreakdown && analytics.deviceBreakdown.length > 0 ? (
                <div className="flex items-center gap-6">
                  <div className="w-1/2">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={analytics.deviceBreakdown}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                        >
                          {analytics.deviceBreakdown.map((entry, i) => (
                            <Cell key={i} fill={deviceColors(entry.name)} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 space-y-2">
                    {analytics.deviceBreakdown.map((d) => (
                      <div key={d.label} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: deviceColors(d.name) }}
                          />
                          <span className="text-gray-700 capitalize">{d.name}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No device data yet</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Top Locations</h2>
              {analytics?.topLocations && analytics.topLocations.length > 0 ? (
                <div className="space-y-2">
                  {analytics.topLocations.slice(0, 5).map((loc, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-xs text-gray-400 text-right">{i + 1}</span>
                        <div>
                          <p className="text-gray-900 font-medium">{loc.city}</p>
                          <p className="text-gray-500 text-xs">{loc.country}</p>
                        </div>
                      </div>
                      <span className="text-gray-700 font-medium">{loc.count} scans</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No location data yet</p>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Quick Stats</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-blue-600 mb-0.5">Total</p>
                  <p className="text-xl font-bold text-blue-900">{stats?.total_scans || 0}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-xs text-green-600 mb-0.5">Today</p>
                  <p className="text-xl font-bold text-green-900">{stats?.today_scans || 0}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-xs text-purple-600 mb-0.5">Week</p>
                  <p className="text-xl font-bold text-purple-900">{stats?.this_week || 0}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3">
                  <p className="text-xs text-orange-600 mb-0.5">Month</p>
                  <p className="text-xl font-bold text-orange-900">{stats?.this_month || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-4">QR Code</h2>
              <div className="flex items-center justify-center bg-gray-100 rounded-xl p-4 mb-4">
                {qrImage ? (
                  <img src={qrImage} alt="QR Code" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <svg className="animate-spin w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="text-gray-500 mb-1">Short URL</p>
                  <p className="font-mono text-blue-600">smartqr.id/c/{code.short_code}</p>
                </div>
                <div className="text-sm">
                  <p className="text-gray-500 mb-1">Destination</p>
                  <p className="text-gray-900 truncate">{code.destination_url}</p>
                </div>
                <div className="text-sm">
                  <p className="text-gray-500 mb-1">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${code.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {code.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="text-gray-500 mb-1">Created</p>
                  <p className="text-gray-900">{new Date(code.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <a
                  href={qrImage}
                  download={`qr-${code.short_code}.png`}
                  className="w-full py-2 px-4 bg-blue-600 text-white text-center text-sm font-semibold rounded-xl hover:bg-blue-700 transition block"
                >
                  Download PNG
                </a>
                <Link
                  href={`/dashboard/codes/${codeId}/edit`}
                  className="w-full py-2 px-4 bg-gray-100 text-gray-700 text-center text-sm font-semibold rounded-xl hover:bg-gray-200 transition block"
                >
                  Edit Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'scans' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">All Recent Scans</h2>
            <span className="text-sm text-gray-500">{analytics?.totalScans || recentScans.length} total scans</span>
          </div>
          {recentScans.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No scans yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Location</th>
                    <th className="pb-3">Device</th>
                    <th className="pb-3">Referrer</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentScans.map((scan) => (
                    <tr key={scan.id} className="text-sm">
                      <td className="py-3 text-gray-900">
                        {new Date(scan.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 text-gray-600">
                        {scan.city}, {scan.country}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          scan.device_category === 'mobile_ios' ? 'bg-blue-100 text-blue-700' :
                          scan.device_category === 'mobile_android' ? 'bg-green-100 text-green-700' :
                          scan.device_category === 'tablet' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {scan.device_category?.replace('mobile_', '').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 text-xs max-w-[200px] truncate">
                        {scan.referrer || <span className="text-gray-400">Direct</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'geo' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Scan Locations</h2>
          <Suspense fallback={<div className="h-64 bg-gray-50 rounded-xl animate-pulse" />}>
            <GeoMap locations={analytics?.scanLocations || []} />
          </Suspense>
          {analytics?.topLocations && analytics.topLocations.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">All Locations</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {analytics.topLocations.map((loc, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    <span className="text-gray-700">{loc.city}, {loc.country}</span>
                    <span className="text-gray-500 font-medium">{loc.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
