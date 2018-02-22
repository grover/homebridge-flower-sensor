# Flower power sensor documentation

From the [Parrot Developer Site](http://forum.developer.parrot.com/t/docs-sensors-informations/94):

## Air Temperature

Range: 

* -5 to +55 (°C)
* 23 to 131 (°F)

The range of temperature that is generally comfortable for most plants is between 10-32°C (50-80°F). Various stresses may affect plants outside this range, but it is highly plant specific.

## Light

Range:
* 0.13 to 104 (mole x m-2 x d-1)

The light sensor is calibrated to measure Photosynthetically Active Radiation (PAR), defined as light in the wavelength between 400 - 700nm (the visible spectrum). There are two common units used to display this measurement, depending on whether you’re interested in PAR accumulated in one day (mole x m-2 x d-1), referred to as the Daily Light Integral (DLI); or whether you’re interested in an instantaneous PAR measurement (umole x m-2 x s-1), which is more commonly displayed on hand-held meters.

To calculate DLI, average the light reading over a full 24-hour period (from samples taken at regular intervals). Typical DLI ranges are usually between 0.1 (very low) to 12 (bright) for indoor locations, and 4 (deep shade) to 25 (full sun) in outdoor locations.
To calculate instantaneous PAR, multiply the current light reading by 1000000 / (24 * 60 * 60), or by approximately 11.574. PAR ranges from 0 (dark) to 1200 (direct, full sun outdoors).
To calculate instantaneous foot-candles (ft-c, or lumens x ft-2), multiply the instantaneous PAR value by 5.01. Note that this is an approximation based on assumptions regarding the spectral content of the light measured.
To calculate instantaneous lux (lumens x m-2), multiply the instantaneous PAR value by 53.93. This is also an approximation based on spectral assumptions.

## Soil Moisture

Range:
* 0 to 50 (%)

The typical soil moisture range is between 8 (very dry) to 45 (saturated). The soil moisture will read 0 when in air. Generally, most plants require watering when the soil moisture is in the range of 12 to 18. If the soil moisture stays > 40 for too long, this may be harmful to some plants (overwatering promotes the growth of pathogens in the soil, and plants require oxygen at their roots for good health). Specific watering and overwatering thresholds depend on the plant type.

Due to variations in soil composition, texture, compaction, and other factors, variation of the soil moisture readings can be greater in practice than the accuracy of the sensor suggests. To reduce these variations, always water around the sensor when it is first inserted into the soil to remove air gaps. When container gardening, always use a container with holes at the bottom for good drainage, and water your plant thoroughly, until a small amount of water emerges from these holes.

## Fertilizer

Range:
* 0 to 10 (mS/cm)

The typical range for fertilizer in horticultural applications is 0 to 4 mS/cm. Generally, fertilizer < 1 is low, fertilizer in the range of 1 - 3 is a good range, above 3 is high, and above 4 may to too high. Fertilizer usage and sensitivity is plant specific.

After application of liquid fertilizer based on the manufacturer recommendation for your plant, you should immediately notice on the sensor that fertilizer is in a good range. When using compost or slow-release fertilizers, it can take a longer time for the fertilizer to register on the sensor.

Due to uneven distribution of fertilizers in soils, variation on fertilizer readings can be greater in practice than the accuracy of the sensor suggests. To reduce these variations, always water your plant thoroughly – this gives fertilizer the best chance to evenly distribute throughout the soil.
