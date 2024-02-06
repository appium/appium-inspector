import JavaFramework from './java-common';

class JavaJUnit5Framework extends JavaFramework {
  wrapWithBoilerplate(code) {
    const [pkg, cls, capStr] = this.getBoilerplateParams();
    // Import everything from Selenium in order to use WebElement, Point and other classes.
    return `// This sample code supports Appium Java client >=9
// https://github.com/appium/java-client
import io.appium.java_client.remote.options.BaseOptions;
import io.appium.java_client.${pkg}.${cls};
import java.net.URL;
import java.time.Duration;
import java.util.Arrays;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.*;

public class SampleTest {

  private ${cls} driver;

  @BeforeEach
  public void setUp() {
    var options = new BaseOptions()
${capStr};

    private URL getUrl() {
      try {
        return new URL("${this.serverUrl}");
      } catch (MalformedURLException e) {
        e.printStackTrace();
      }
    }

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
}
`;
  }
}

JavaJUnit5Framework.readableName = 'Java - JUnit5';

export default JavaJUnit5Framework;
