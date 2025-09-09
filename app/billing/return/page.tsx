import { Suspense } from 'react'
import SuccessReturn from './SuccessReturn'

const page = () => {
    return (
        <Suspense fallback={<p className="text-gray-400">Loading…</p>}>
            <SuccessReturn />
        </Suspense>
    )
}

export default page