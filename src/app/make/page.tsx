import { MakeCard } from "@/components/MakeCard"
import { Statement } from "@/components/Statement"

export default function Home() {
	return (
		<div className="flex flex-col items-center">
			<MakeCard />
			<Statement />
		</div>
	)
}
