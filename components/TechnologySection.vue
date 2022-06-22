<template>
  <h3 id="technology">Technology</h3>
  <table>
    <thead>
      <tr>
        <th>Icon</th>
        <th>Technology</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/video.svg"
            alt=""
          />
        </td>
        <td>{{ $t('tech__video_camera') }}</td>
        <td v-html="$md.render($t('tech__video_camera__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/video.svg"
            alt=""
          />
        </td>
        <td>{{ $t('tech__video_camera_infrared') }}</td>
        <td v-html="$md.render($t('tech__video_camera_infrared__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/image.svg"
            alt=""
          />
        </td>
        <td>{{ $t('tech__image') }}</td>
        <td v-html="$md.render($t('tech__image__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/image.svg"
            alt=""
          />
        </td>
        <td>{{ $t('tech__image_infrared') }}</td>
        <td v-html="$md.render($t('tech__image_infrared__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/voice.svg"
            alt=""
          />
        </td>
        <td>{{ $t('tech__assistance_station') }}</td>
        <td v-html="$md.render($t('tech__assistance_station__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/voice.svg"
            alt=""
          />
        </td>
        <td>{{ $t('tech__voice') }}</td>
        <td v-html="$md.render($t('tech__voice__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/light.svg"
            alt=""
          />
        </td>
        <td>{{ $t('tech__passive_infrared_sensor') }}</td>
        <td v-html="$md.render($t('tech__passive_infrared_sensor__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/water.svg"
            alt=""
          />
        </td>
        <td>{{ $t('tech__soil_moisture_sensor') }}</td>
        <td v-html="$md.render($t('tech__soil_moisture_sensor__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/water.svg"
            alt=""
          />
        </td>
        <td>{{ $t('tech__water_quality') }}</td>
        <td v-html="$md.render($t('tech__water_quality__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/sound.svg"
            alt=""
          />
        </td>
        <td>{{ $t('tech__sound_level_meter') }}</td>
        <td v-html="$md.render($t('tech__sound_level_meter__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/light.svg"
            alt=""
          />
        </td>
        <td>{{ $t('tech__radar') }}</td>
        <td v-html="$md.render($t('tech__radar__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/light.svg"
            alt=""
          />
        </td>
        <td>{{ $t('tech__li_dar') }}</td>
        <td v-html="$md.render($t('tech__li_dar__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/air.svg"
            alt=""
          />
        </td>
        <td>{{ $t('tech__air_quality') }}</td>
        <td v-html="$md.render($t('tech__air_quality__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/air.svg"
            alt=""
          />
        </td>
        <td>Weather Station</td>
        <td>
          A set of instruments for measuring atmospheric conditions such as
          temperature, precipitation, wind speed and direction, and barometric
          pressure. Find out more
          <a href="https://en.wikipedia.org/wiki/Weather_station">here</a>
        </td>
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/wave.svg"
            alt=""
          />
        </td>
        <td>Wireless Access Point</td>
        <td>
          Provides wireless access to a wired computer network, or to the
          internet. Find out more
          <a href="https://en.wikipedia.org/wiki/Wireless_access_point">here</a>
        </td>
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/wave.svg"
            alt=""
          />
        </td>
        <td>RFID</td>
        <td>
          Enables the identification of items using electromagnetic fields,
          commonly used to track inventory in stores, but not for identifying
          individual items. Find out more
          <a href="https://en.wikipedia.org/wiki/Radio-frequency_identification"
            >here</a
          >
        </td>
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/wave.svg"
            alt=""
          />
        </td>
        <td>NFC</td>
        <td>
          A wireless communication protocol for electronic devices that are within
          a short distance of each other, typically used in ticketing or payment
          systems. No identifying data is collected in this case. Find out more
          <a href="https://en.wikipedia.org/wiki/Near-field_communication"
            >here</a
          >
        </td>
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/weight.svg"
            alt=""
          />
        </td>
        <td>Weighing Scale</td>
        <td>
          A weighing scale is a device to measure weight or mass. No identifying
          data is collected in this case. Find out more
          <a href="https://en.wikipedia.org/wiki/Weighing_scale">here</a>
        </td>
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/air.svg"
            alt=""
          />
        </td>
        <td>Thermometer</td>
        <td>
          Measures the temperature of or changes of temperature in the physical
          environment, and quantifies those attributes according to a standardized
          scale such as Celsius or Fahrenheit. Find more more
          <a href="https://en.wikipedia.org/wiki/Thermometer">here</a>
        </td>
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/yellow/wave.svg"
            alt=""
          />
        </td>
        <td>Identifiable NFC</td>
        <td>
          A wireless communication protocol for electronic devices that are within
          a short distance of each other, typically used in ticketing or payment
          systems. In this case, unique identification is possible, for example if
          a particular item is closely associated with an individual&#39;s
          <a href="https://en.wikipedia.org/wiki/Personal_data">personal data</a>.
          Find out more
          <a href="https://en.wikipedia.org/wiki/Near-field_communication"
            >here</a
          >
        </td>
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/yellow/wave.svg"
            alt=""
          />
        </td>
        <td>Identifiable RFID</td>
        <td>
          Enables the identification of items using electromagnetic fields,
          commonly used to track inventory in stores. In this case, unique
          identification is possible, for example if a particular item is closely
          associated with an individual&#39;s
          <a href="https://en.wikipedia.org/wiki/Personal_data">personal data</a>.
          Find out more
          <a href="https://en.wikipedia.org/wiki/Radio-frequency_identification"
            >here</a
          >
        </td>
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/yellow/video.svg"
            alt=""
          />
        </td>
        <td>Identifiable Video</td>
        <td>
          Collects
          <a href="https://en.wikipedia.org/wiki/Video">video footage</a> of a
          sufficient resolution where individuals can be identified, for example
          by capturing images of faces or unique numbers such as vehicle license
          plates. Identifying information can be collected either through manual
          review by a person, or through
          <a href="https://en.wikipedia.org/wiki/Computer_vision"
            >computer vision</a
          >
          techniques that derives information in the form of data from video or
          images.
        </td>
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/yellow/voice.svg"
            alt=""
          />
        </td>
        <td>Identifiable Voice</td>
        <td>
          Audio data is collected that does or can identify individuals, either
          through manual review or by technologies that can determine either what
          is being said, or who is saying it. Find out more about
          <a href="https://en.wikipedia.org/wiki/Speech_recognition"
            >speech recognition</a
          >
          or
          <a href="https://en.wikipedia.org/wiki/Speaker_recognition"
            >speaker recognition</a
          >.
        </td>
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/yellow/image.svg"
            alt=""
          />
        </td>
        <td>Identifiable Image</td>
        <td>
          Collects
          <a href="https://en.wikipedia.org/wiki/Image#Characteristics"
            >still images</a
          >
          of a sufficient resolution where individuals can be identified, for
          example by capturing images of faces or unique numbers such as vehicle
          license plates. Identifying information can be collected either through
          manual review of images by a person, or through
          <a href="https://en.wikipedia.org/wiki/Computer_vision"
            >computer vision</a
          >
          techniques that derives information in the form of data from images.
        </td>
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/blue/video.svg"
            alt=""
          />
        </td>
        <td>De-identified Video</td>
        <td>
          Collects
          <a href="https://en.wikipedia.org/wiki/Video">video footage</a> of a
          sufficient resolution where individuals can be identified, for example
          by capturing images of faces or unique numbers such as vehicle license
          plates. However, the video is processed in a way that removes
          identifying characteristics before it is used or stored (known as
          <em>de-identified before first use</em> or
          <em>de-identified on device</em>), for example by blurring faces using
          <a href="https://en.wikipedia.org/wiki/Computer_vision"
            >computer vision</a
          >. Find out more about
          <a href="https://en.wikipedia.org/wiki/De-identification"
            >de-identification</a
          >
        </td>
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/blue/image.svg"
            alt=""
          />
        </td>
        <td>De-identified Image</td>
        <td>
          Collects
          <a href="https://en.wikipedia.org/wiki/Image#Characteristics"
            >still images</a
          >
          of a sufficient resolution where individuals can be identified, for
          example by capturing images of faces or unique numbers such as vehicle
          license plates. However, images are processed in a way that removes
          identifying characteristics before it is used or stored (known as
          <em>de-identified before first use</em> or
          <em>de-identified on device</em>), for example by blurring faces using
          <a href="https://en.wikipedia.org/wiki/Computer_vision"
            >computer vision</a
          >. Find out more about
          <a href="https://en.wikipedia.org/wiki/De-identification"
            >de-identification</a
          >
        </td>
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/tech/blue/voice.svg"
            alt=""
          />
        </td>
        <td>De-identified Voice</td>
        <td>
          Audio data is collected that does or can identify individuals, either
          through manual review or technologies that can determine either what is
          being said, or who is saying it. Find out more about
          <a href="https://en.wikipedia.org/wiki/Speech_recognition"
            >speech recognition</a
          >
          or
          <a href="https://en.wikipedia.org/wiki/Speaker_recognition"
            >speaker recognition</a
          >. Data is processed in a way that removes identifying characteristics
          before it is used or stored (known as
          <em>de-identified before first use</em> or
          <em>de-identified on device</em>). Find out more
          <a href="https://en.wikipedia.org/wiki/De-identification">here</a>
        </td>
      </tr>
    </tbody>
  </table>
</template>