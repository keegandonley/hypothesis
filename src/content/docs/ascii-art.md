# ASCII Art

Convert images to ASCII art entirely in your browser using the Canvas API. No uploads, no server — pixel sampling and rendering happen locally.

## Usage

1. Drop an image onto the drop zone, or click to browse — or switch to **URL** mode and paste a public image URL
2. The ASCII art generates immediately in the output panel
3. Adjust the controls to tune the result
4. Click **Copy** in the output panel to copy the text to your clipboard

## Controls

### Output

| Control | Description |
|---------|-------------|
| **Width** | Number of character columns in the output (20–200). More columns = more detail but smaller characters when displayed. |
| **Chars** | Character set used to represent pixel density. Simple (10 chars), Detailed (70 chars), or Blocks (Unicode block elements). |
| **Invert** | When on, bright pixels map to dense characters — good for dark backgrounds (default). Turn off for printing on white. |
| **Grayscale** | Strips color before sampling, which often produces more consistent tonal gradients. |

### Image adjustments

Applied before sampling — changes are reflected live in the image preview.

| Control | Default | Description |
|---------|---------|-------------|
| **Brightness** | 100% | Scales pixel luminance. Increase to lift detail out of dark images. |
| **Contrast** | 100% | Stretches the tonal range. Higher contrast produces sharper distinction between dense and sparse characters. |
| **Sharpness** | 0 | Applies an unsharp mask convolution on the sampled grid. Useful for photos where edges are blurring into flat regions. |

## How it works

The image is drawn onto a hidden `<canvas>` element scaled to the target column width. The row count is derived from the column width and the image's aspect ratio, with a 0.5× correction factor to account for the typical 2:1 height-to-width ratio of monospace characters.

Brightness, contrast, and grayscale are applied as CSS filter functions on the canvas context before drawing. Sharpening is applied as a 5-point convolution kernel on the sampled pixel data: `5×center − top − bottom − left − right`, blended by the sharpness amount.

Each pixel's luminance is computed using the Rec. 709 perceptual weights (R×0.2126 + G×0.7152 + B×0.0722) and mapped to a character in the selected set.

## Examples

**Blocks** (`blocks` character set, width 80):

```
                                █ ██                                                
                                ███                                                 
                                 █ █                                                
                                  █ █▒                                              
                                █ ███ ▒████▒                                        
                              █ ██████▓     ██                                      
                            █ ░▓  ░░ ░▓░ ░░▒  █                                    
                           ██▒▒▒▒▒▒▒▒▒▒█░ ░░▒  █                                   
                           █ ▓▒▒▒▒▒▒▒▒▒▒█▒ ░░▒ █░▓█                                
                           █░▒▒▒▒▒▒▒▒▒▒▒▒▒▓  ░▒ █ █▓▓▓▓▓▓███▓████  █               
                           ▓█ ░▒▒▒▒▒░░░█▓██▒█   █  █▓█████▓███░ ▒██                
                           ████████████      █  ▒█ ░░███▒  ░███░                   
                         █                ▓▓▒ █  █  ██████████                     
                        █ ████████████████ ▓▒ █▒ █   ████████                      
                       ░ ████████████▒ ██ █  █ ▓░░█  ██████▓█                      
                        █████████ ▓████████▒█ ▒▒█ ████▓█████▓█                     
                         ██████████▓░    ██  ▒▓░▒░▒███████████                     
                              ▒    ░░░▒░ ░░███ █▒▒ ██████████▓                     
                               ██████████░ ░█  ██▒ █    ▓█▓█▓█  ██                 
                            ██    █▒░   ░ █░  █▒░░ █ █████████    ░                
                          █▓     ██ █████████▓  ░██ ██   █▓█ ░█   ▒  ██            
                         █░   ▒██ ▓█  ██  ░▒▒███░ █████ ███  ▒█   ▓  ███           
                        ██  █ █    ██   ██░░░░  ░█████ ████ ▓██ ██▓   █            
                        ███▓   █▓    ██  ██▒ ▒▒▒▒░ ░  █▓██ █▒     █ ░              
                       ██ █████████▓   ██░  █ ▒▒░░     ██ █  ████ ▒▒               
                     █ ██ █▒░░    ████       █░░█████▓█░ ▓█ █▒   █▒░               
                   █▒██  ██  ███    █  ░░▒    ██ ░  ░▒▒▒░█ █░▒ ░░ █                
                 ███  █   ███▒ ██▒██ █▓   ░▒    █ ▒▒▓▓░▒░█░▓▒░░░░ █                
                ██  ▓▒ ███ ▒███▒ ▒░▒█▒▒▒█░   ██  ██ ▒ █░▒░███ ░░░██░               
              ██  █  ▓▓░░██   █ █▒░  ░▒█ ▒░██  ▓░  ██░█ ▒▒ █░ ░░ ░ █               
             █  ▓▒ ▓█████      █ ▓▓▓▓▒▒ ▒▓██ █░░░ █   ██ ▒░███ ░ ░░█               
            █ █  ░▓▒░██        ░ ▓▒▒▒▒▒▒▒▒  ██▒▓░█ ▒▒░  █░███   ██ ▒               
            █  ██████           █ ▓▒▒▒▒▒▒▒▒▒░ ███ █░░░▒ █    ▓█ ░ █                
             █████               █░█▓▒▒▒▒▒▒▒▒▒░░▓█░█▒█ █▓░▒▒░ █░░ █                
                                    █████████████▓▒▓████░▒▒ ░ █ ██                 
                                                       █████████                   
```

**Detailed** (`detailed` character set, width 80):

```
                                $ $W                                                
                                $$$                                                 
                                 $^$                                                
                                  $`${                                              
                                $ $$% |$*$$]                                        
                              $ $$h$$$Y     $$                                      
                            $I<LI,+!"lL[ ~})  $                                    
                           $Mvnnnnnnnnnai <+\  $                                   
                           $.Xnnnnnnnnnnk( >~( $!Zk  ,"^                           
                           $?unnnnnnnnnnx1L  i\ $ $bbbbbbh*hbW$$$  $               
                           J$.})||(1]!+pZ$$/$ ^ $  $ch$@$$b#$@-,u#@                
                           $$$$$$$$$$$$      $  x$ i-hB8r ^;$8$]                   
                         $                mO\ $  $  $Wk$$$$@8$                     
                        $ $$$$$$$$$$$$$$$$ Y| $c $   $$Wh&$$$                      
                       i $$$$$$$$$$$$| $$'$  $'QI[$  *$$$$$b$                      
                        $$$b%$$$$.c$$$$$$$Mf$ rno $$$qbhW@a$b$                     
                         $$$$$$$$$$U~   ,$$. /q~x[x&a$$@$B&M@$                     
                              \ ' 'i-}{}"!_$$$ $(n'$$$*8#a&$$0                     
                               $$$ko@$$$$].[$ '$@1`$    0$bMb$  WB                 
                            $$    $|).  >.B<. ${_>`$ $W$$$@$$$    !                
                          $Z     $$l$$$$$$$@#Q ;_$$ $& ".$b$.{k  't  $$            
                         $[   n$$ q$  $$  >(fa$$- $*%$8 $hM..{$   w  $$$           
                        q$ I$ $    $$   $$I]1+.`>M$$$$.$M$$ Y$& $$L   *            
                        $$$w   $v    $$  $$)./tt/~,_  $b$% $|     $ ^              
                       $$ $$$$$$$$$C   $$+  $ 1(_~^    @$`$  $$$$ f|               
                     $ $$^*(>-    $$$$    "  $l<@$$$$qh}'X$'$\   $/-               
                   $|$$  $$  a$$,   $  >}n  ; $$ [I;_rnn?$ $!n,]~ $                
                 $$$  $   $$$j'k$x$$ kY  ;[r    $ (nzC?n?$,nv1i]! %'               
                $$  z) $$$.u$$$(`r?|$t\18>   $$  $&I1 $-fl$$$ -~_$$?               
              $$  $..Uz-lp$   $ df]l ?r$ n>$$ lY]  $$<$ x(`$l ~]"~.$               
             $  Cj Q$$a$$      $.YXXXcf"fO$$"h<~}'$`  $$"f[$$$.+ <<$               
            $ $ ^!px>W$        _"Yunnnnnn|^.$MtO}$ \v,  #<$$M   $$ t               
            $' $ah$$$           $ 0nnnnnnnnx>.$o$`b__)c $    U$ } $                
             $$$$$               $_oXnnnnnnnnn!IL$-oxh %m<tz1 $~!'$                
                                   ^#@&&&&&&&&W8kJvL$d$$]ft;l $.$$                 
                                                       %$$$$$$$$                   
```

## URL mode and CORS

When using URL mode, the image is fetched with `crossOrigin: "anonymous"`. This requires the host server to send an `Access-Control-Allow-Origin: *` header — most CDNs and stock photo hosts do not, which will produce a load error. Use file upload mode as a fallback.
