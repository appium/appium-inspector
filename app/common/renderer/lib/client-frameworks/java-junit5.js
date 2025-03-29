import JavaFramework from './java-common.js';

export default class JavaJUnit5Framework extends JavaFramework {
  static readableName = 'Java - JUnit5';

  wrapWithBoilerplate(code) {
    const [pkg, cls, capStr] = this.getBoilerplateParams();
    // Import everything from Selenium in order to use WebElement, Point and other classes.
    return `// This sample code supports Appium Java client >=9
// https://github.com/appium/java-client
import io.appium.java_client.remote.options.BaseOptions;
import io.appium.java_client.AppiumBy;
import io.appium.java_client.${pkg}.${cls};
import java.net.URL;
import java.net.MalformedURLException;
import java.time.Duration;
import java.util.Arrays;
import java.util.Base64;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.*;

public class SampleTest {

  private ${cls} driver;

  @BeforeEach
  public void setUp() {
    Capabilities options = new BaseOptions()
${capStr};    

    driver = new ${cls}(this.getUrl(), options);
  }

  @Test
  public void sampleTest() {
${this.indent(code, 4)}
  }

  @AfterEach
  public void tearDown() {
    driver.quit();
  }
    
  private URL getUrl() {
      try {
        return new URL("${this.serverUrl}");
      } catch (MalformedURLException e) {
        e.printStackTrace();
      }
    }
}
`;
  }
}
