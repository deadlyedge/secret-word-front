import { Card, CardContent, CardHeader } from "./ui/card"

export const Statement = () => {
	return (
		<Card className="w-full m-2 lg:w-1/2 2xl:w-1/3 lg:mx-auto bg-red-700/20">
			<CardHeader>声明</CardHeader>
			<CardContent>
				<p>请勿将本网站用于非法用途。</p>
				<br />
				<p>
					本网站公共区域不会上传或存储用户图片或视频，所有上传数据仅限于ORB算法生成的特征码，而这些特征码是无法反推回原图的。请放心使用。
				</p>
				<br />
				<p>
					稍后推出的用户区域会提供用户名和密码登录，用户可以自行上传图片或视频，并生成特征码，以便后续使用。
				</p>
			</CardContent>
		</Card>
	)
}
