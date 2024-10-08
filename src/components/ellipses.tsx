export default function Ellipses() {
    const [count, setCount] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setCount(prev => prev === 4 ? 0 : prev + 1)
        }, 200)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="w-3">
            {count > 0 && "."}
            {count > 1 && "."}
            {count > 2 && "."}
            &nbsp;
        </div>
    )
}