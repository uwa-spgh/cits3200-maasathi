import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        let appBackground = UIColor(red: 251 / 255, green: 247 / 255, blue: 245 / 255, alpha: 1)
        window = UIWindow(windowScene: windowScene)
        window?.backgroundColor = appBackground
        window?.overrideUserInterfaceStyle = .light
        let rootViewController = CAPBridgeViewController()
        rootViewController.view.backgroundColor = appBackground
        // The app uses a light surface, so keep the status-bar content dark and
        // prevent iOS from adding a translucent contrast band above the web view.
        rootViewController.statusBarStyle = .darkContent
        window?.rootViewController = rootViewController
        window?.makeKeyAndVisible()
        rootViewController.setNeedsStatusBarAppearanceUpdate()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
